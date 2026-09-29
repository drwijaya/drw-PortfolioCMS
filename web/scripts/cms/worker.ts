import { createBackup, pruneBackups } from "../../lib/cms/backup";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, getPool } from "../../lib/cms/db";
import { entries, jobs, system, messages } from "../../lib/cms/db-schema";
import { publishEntry } from "../../lib/cms/repository";
import { mailSettings, sendConfiguredMail } from "../../lib/cms/mail";
import { ownerNotification, senderReceipt } from "../../lib/contact-email";
let running = true;
process.on("SIGTERM", () => {
  running = false;
});
process.on("SIGINT", () => {
  running = false;
});
async function tick() {
  await db()
    .insert(system)
    .values({ key: "worker-heartbeat", value: { running: true } })
    .onConflictDoUpdate({
      target: system.key,
      set: { updatedAt: new Date(), value: { running: true } },
    });
  await db().execute(
    sql`delete from cms_rate_limit where last_request < ${Date.now() - 86400000}`,
  );
  await db().execute(
    sql`delete from cms_verification where expires_at < now()`,
  );
  await db().execute(sql`delete from cms_session where expires_at < now()`);
  // A crashed SMTP job is ambiguous. Never blindly resend it.
  await db().execute(
    sql`update cms_jobs set status=case when type like 'contact-%' then 'unknown' else 'queued' end, error='Worker interrupted; delivery outcome requires review', locked_at=null where status='processing' and locked_at < now()-interval '2 minutes'`,
  );
  if (process.env.CMS_BACKUP_DIR) {
    const [last] = await db()
      .select()
      .from(system)
      .where(eq(system.key, "daily-backup"));
    if (
      !last ||
      Date.now() - last.updatedAt.getTime() >
        ((last.value as { ok?: boolean }).ok === false ? 3600000 : 86400000)
    ) {
      let ok = true;
      try {
        await createBackup("worker");
        await pruneBackups();
      } catch {
        ok = false;
        console.error("[cms-worker] backup failed; other jobs continue");
      }
      await db()
        .insert(system)
        .values({ key: "daily-backup", value: { ok } })
        .onConflictDoUpdate({
          target: system.key,
          set: { updatedAt: new Date(), value: { ok } },
        });
    }
  }
  const [maintenance] = await db()
    .select()
    .from(system)
    .where(eq(system.key, "daily-maintenance"));
  if (!maintenance || Date.now() - maintenance.updatedAt.getTime() > 86400000) {
    const settings = await mailSettings();
    await db().execute(
      sql`delete from cms_messages where created_at < now()-make_interval(days => ${settings.retentionDays})`,
    );
    await db().execute(
      sql`delete from cms_system where key like 'review:%' and updated_at < now()-interval '1 day'`,
    );
    await db()
      .insert(system)
      .values({ key: "daily-maintenance", value: { ok: true } })
      .onConflictDoUpdate({
        target: system.key,
        set: { value: { ok: true }, updatedAt: new Date() },
      });
  }
  const due = await db()
    .select()
    .from(entries)
    .where(sql`scheduled_at <= now() and trashed_at is null`)
    .limit(10);
  for (const e of due) {
    try {
      await publishEntry(e.id, e.scheduledVersion ?? e.version, "scheduler");
    } catch {
      await db()
        .update(entries)
        .set({ scheduledAt: null, scheduledVersion: null })
        .where(eq(entries.id, e.id));
      await db()
        .insert(jobs)
        .values({
          id: randomUUID(),
          type: "publish",
          status: "failed",
          payload: { entryId: e.id },
          error: "Scheduled publication failed validation; review the draft",
        });
    }
  }
  const job = await db().transaction(async (tx) => {
    const result = await tx.execute(
      sql`select * from cms_jobs where status='queued' and run_at<=now() order by run_at for update skip locked limit 1`,
    );
    const item = result.rows[0];
    if (!item) return null;
    await tx
      .update(jobs)
      .set({
        status: "processing",
        lockedAt: new Date(),
        attempts: sql`${jobs.attempts}+1`,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, String(item.id)));
    return item;
  });
  if (!job) return;
  try {
    if (job.type === "backup") await createBackup("worker");
    if (job.type === "contact-owner" || job.type === "contact-receipt") {
      const payload = job.payload as { messageId: string };
      const [message] = await db()
        .select()
        .from(messages)
        .where(eq(messages.id, payload.messageId));
      if (!message) throw new Error("Message missing");
      const settings = await mailSettings(),
        origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const template =
        job.type === "contact-owner"
          ? ownerNotification(message, origin)
          : senderReceipt(message, origin, settings.to);
      const custom =
        job.type === "contact-owner"
          ? settings.ownerTemplate
          : settings.receiptTemplate;
      const text = custom
        ? custom.replace(
            /\{\{(name|email|body)\}\}/g,
            (_, key: keyof typeof message) => String(message[key]),
          )
        : template.text;
      await sendConfiguredMail(settings, {
        ...template,
        ...(custom ? { text, html: undefined } : {}),
        subject:
          job.type === "contact-owner"
            ? settings.ownerSubject
            : settings.receiptSubject,
        to: job.type === "contact-owner" ? settings.to : message.email,
        replyTo: job.type === "contact-owner" ? message.email : settings.to,
        id: String(job.id),
      });
      if (job.type === "contact-owner" && settings.receipt)
        await db()
          .insert(jobs)
          .values({
            id: randomUUID(),
            type: "contact-receipt",
            payload: { messageId: message.id },
          });
    }
    // Content readers are request-dynamic; no stale public data is retained in the worker.
    await db()
      .update(jobs)
      .set({
        status: "done",
        lockedAt: null,
        error: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, String(job.id)));
  } catch (error) {
    const code = (error as { code?: string }).code;
    const uncertain =
      ["ETIMEDOUT", "ESOCKET", "ECONNRESET"].includes(code ?? "") ||
      (error instanceof Error && error.name === "TimeoutError");
    const attempts = Number(job.attempts) + 1;
    const retry =
      !uncertain &&
      ["ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND"].includes(code ?? "") &&
      attempts < 3;
    await db()
      .update(jobs)
      .set({
        status: uncertain ? "unknown" : retry ? "queued" : "failed",
        runAt: new Date(Date.now() + attempts * 60000),
        lockedAt: null,
        error: uncertain
          ? "Delivery outcome unknown; inspect provider before retrying"
          : "Delivery failed; check provider configuration and logs",
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, String(job.id)));
  }
}
while (running) {
  try {
    await tick();
  } catch {
    console.error("[cms-worker] tick failed; retrying");
  }
  if (process.env.CMS_WORKER_ONCE === "true") break;
  await new Promise((r) => setTimeout(r, 5000));
}
await getPool().end();

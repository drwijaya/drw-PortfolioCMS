import { createHmac, randomUUID } from "node:crypto";
import { sql, eq } from "drizzle-orm";
import { db } from "./db";
import { messages, jobs, rateLimit } from "./db-schema";
import { mailSettings } from "./mail";
import { CmsError } from "./repository";
export async function acceptContact(
  message: { name: string; email: string; body: string },
  ip: string,
  key?: string,
) {
  const settings = await mailSettings(),
    id = key && /^[a-f0-9-]{36}$/.test(key) ? key : randomUUID();
  const fingerprint = createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "")
    .update(ip)
    .digest("hex");
  const now = Date.now();
  await db().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${fingerprint}))`,
    );
    const [existing] = await tx
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.id, id));
    if (existing) return;
    const bucketKey = `contact:${fingerprint}`;
    const [bucket] = await tx
      .select()
      .from(rateLimit)
      .where(eq(rateLimit.key, bucketKey));
    const current =
      bucket && now - bucket.lastRequest < settings.windowMinutes * 60000
        ? bucket.count
        : 0;
    if (current >= settings.rateLimit)
      throw new CmsError("Terlalu banyak pesan. Coba lagi nanti.", 429);
    await tx
      .insert(rateLimit)
      .values({
        id: randomUUID(),
        key: bucketKey,
        count: current + 1,
        lastRequest: current ? bucket!.lastRequest : now,
      })
      .onConflictDoUpdate({
        target: rateLimit.key,
        set: {
          count: current + 1,
          lastRequest: current ? bucket!.lastRequest : now,
        },
      });
    await tx.insert(messages).values({ id, ...message });
    await tx
      .insert(jobs)
      .values({
        id: randomUUID(),
        type: "contact-owner",
        payload: { messageId: id },
      });
  });
  return { ok: true, confirmationSent: false, queued: true };
}

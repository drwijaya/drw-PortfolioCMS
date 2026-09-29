import { reviewEntry, requireReview, clearReview } from "@/lib/cms/review";
import { contentDiagnostics } from "@/lib/cms/diagnostics";
import { recordContactTest } from "@/lib/cms/integration-test";
import { takeLimit } from "@/lib/cms/rate-limit";
import { randomUUID } from "node:crypto";
import { eq, desc, sql, and, ne } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/cms/db";
import * as tables from "@/lib/cms/db-schema";
import { requireOwner, sameOrigin, errorResponse } from "@/lib/cms/security";
import { auth } from "@/lib/cms/auth";
import { readBody, json } from "@/lib/cms/http";
import {
  listEntries,
  getEntry,
  createEntry,
  saveEntry,
  entryAction,
  entryRevisions,
  dashboard,
  CmsError,
  logAudit,
} from "@/lib/cms/repository";
import {
  KINDS,
  validateDocument,
  walkBlocks,
  type EntryKind,
} from "@/lib/cms/model";
import { seedDocuments } from "@/lib/cms/seed";
import {
  uploadMedia,
  cropMedia,
  deleteMedia,
  storageStatus,
} from "@/lib/cms/media";
import { setSecret, testConnection, sendConfiguredMail } from "@/lib/cms/mail";
import { contactSettingsSchema, validatePolicies } from "@/lib/cms/policies";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const version = z.number().int().positive();
async function handle(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: p } = await params,
      method = request.method;
    if (method !== "GET") sameOrigin(request);
    const sensitive =
      p[0] === "secrets" ||
      p[0] === "import" ||
      (p[0] === "backups" && method !== "GET") ||
      method === "DELETE";
    const owner = await requireOwner({
      headers: request.headers,
      touch: method !== "GET",
      fresh: sensitive,
    });
    const actor = owner.user.id;
    if (p[0] === "reauth" && method === "POST") {
      await takeLimit(`reauth:${actor}`);
      const b = z
        .object({ password: z.string(), code: z.string() })
        .parse(await readBody(request));
      await auth().api.verifyPassword({
        headers: request.headers,
        body: { password: b.password },
      });
      await auth().api.verifyTOTP({
        headers: request.headers,
        body: { code: b.code },
      });
      await db()
        .update(tables.sessionPolicy)
        .set({ reauthenticatedAt: new Date() })
        .where(eq(tables.sessionPolicy.sessionId, owner.session.id));
      await logAudit(actor, "auth.reauthenticate");
      return json({ ok: true });
    }
    if (
      p[0] === "security" &&
      p[1] === "rotate-authenticator" &&
      method === "POST"
    ) {
      await requireOwner({ headers: request.headers, fresh: true });
      await db().transaction(async (tx) => {
        await tx
          .delete(tables.twoFactor)
          .where(eq(tables.twoFactor.userId, actor));
        await tx
          .update(tables.user)
          .set({ twoFactorEnabled: false, updatedAt: new Date() })
          .where(eq(tables.user.id, actor));
        await tx
          .delete(tables.session)
          .where(
            and(
              eq(tables.session.userId, actor),
              ne(tables.session.id, owner.session.id),
            ),
          );
      });
      await logAudit(actor, "auth.rotate-authenticator");
      return json({ enrollmentRequired: true });
    }
    if (p[0] === "jobs" && p[2] === "retry" && method === "POST") {
      await requireOwner({ headers: request.headers, fresh: true });
      const b = z
        .object({ confirmUnknown: z.boolean().default(false) })
        .parse(await readBody(request));
      const [job] = await db()
        .select()
        .from(tables.jobs)
        .where(eq(tables.jobs.id, p[1]));
      if (!job || !["unknown", "failed"].includes(job.status))
        throw new CmsError("Job tidak dapat dicoba ulang");
      if (job.status === "unknown" && !b.confirmUnknown)
        throw new CmsError(
          "Periksa provider terlebih dahulu; pengiriman ulang dapat membuat duplikasi",
        );
      await db()
        .update(tables.jobs)
        .set({
          status: "queued",
          error: null,
          runAt: new Date(),
          lockedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(tables.jobs.id, p[1]));
      await logAudit(actor, "job.retry", p[1], { previousStatus: job.status });
      return json({ ok: true });
    }
    if (p[0] === "heartbeat" && method === "POST") return json({ ok: true });
    if (p[0] === "dashboard") return json(await dashboard());
    if (p[0] === "presets") {
      if (method === "GET")
        return json(
          await db()
            .select()
            .from(tables.system)
            .where(sql`key like 'palette-preset:%'`)
            .orderBy(desc(tables.system.updatedAt)),
        );
      if (method === "POST") {
        const b = z
          .object({
            name: z.string().trim().min(1).max(80),
            data: z.record(z.unknown()),
          })
          .strict()
          .parse(await readBody(request));
        const { paletteIssues } = await import("@/lib/cms/palette");
        const issues = paletteIssues(b.data);
        if (issues.length) throw new CmsError(issues.join("; "));
        const key = `palette-preset:${randomUUID()}`;
        await db().insert(tables.system).values({ key, value: b });
        await logAudit(actor, "palette.preset-save", key);
        return json({ key }, 201);
      }
      if (method === "DELETE") {
        if (!p[1]?.startsWith("palette-preset:"))
          throw new CmsError("Preset tidak valid");
        await db().delete(tables.system).where(eq(tables.system.key, p[1]));
        await logAudit(actor, "palette.preset-delete", p[1]);
        return json({ ok: true });
      }
    }
    if (p[0] === "templates") return json(seedDocuments());
    if (p[0] === "entries") {
      if (p.length === 1 && method === "GET") {
        const kind = new URL(request.url).searchParams.get("kind");
        if (kind && !KINDS.includes(kind as EntryKind))
          throw new CmsError("Jenis tidak valid");
        return json(await listEntries(kind as EntryKind | undefined));
      }
      if (p.length === 1 && method === "POST")
        return json(await createEntry(await readBody(request), actor), 201);
      if (p[2] === "review" && method === "POST") {
        const b = z.object({ version }).parse(await readBody(request));
        await reviewEntry(owner.session.id, p[1], b.version);
        return json({ ok: true });
      }
      if (p[2] === "revisions" && method === "GET")
        return json(await entryRevisions(p[1]));
      if (p[2] === "action" && method === "POST") {
        const b = z
          .object({
            action: z.enum([
              "publish",
              "unpublish",
              "trash",
              "restore",
              "delete",
              "schedule",
              "cancel-schedule",
              "restore-revision",
            ]),
            version,
            at: z.string().optional(),
            revision: z.number().optional(),
          })
          .parse(await readBody(request));
        if (["publish", "schedule"].includes(b.action))
          await requireReview(owner.session.id, p[1], b.version);
        if (b.action === "delete")
          await requireOwner({ headers: request.headers, fresh: true });
        const result = await entryAction(p[1], b.action, b.version, actor, b);
        await clearReview(owner.session.id, p[1]);
        revalidatePath("/", "layout");
        return json(result);
      }
      if (p[2] === "duplicate" && method === "POST") {
        const e = await getEntry(p[1]);
        const doc = structuredClone(e.draft);
        doc.slug += `-copy-${Date.now()}`;
        doc.title += " (salinan)";
        walkBlocks(doc.blocks, (block) => {
          block.id = randomUUID();
        });
        return json(await createEntry(doc, actor), 201);
      }
      if (method === "GET") return json(await getEntry(p[1]));
      if (method === "PUT") {
        const b = z
          .object({
            document: z.unknown(),
            version,
            autosave: z.boolean().optional(),
          })
          .parse(await readBody(request));
        return json(
          await saveEntry(
            p[1],
            b.document,
            b.version,
            actor,
            b.autosave ? "autosave" : "save",
          ),
        );
      }
    }
    if (p[0] === "media") {
      if (method === "POST" && p[2] === "restore") {
        await db()
          .update(tables.media)
          .set({ trashedAt: null })
          .where(eq(tables.media.id, p[1]));
        await logAudit(actor, "media.restore", p[1]);
        return json({ ok: true });
      }
      if (method === "POST" && p[2] === "crop") {
        const crop = z
          .object({
            left: z.number().int().nonnegative(),
            top: z.number().int().nonnegative(),
            width: z.number().int().positive(),
            height: z.number().int().positive(),
          })
          .strict()
          .parse(await readBody(request));
        return json(await cropMedia(p[1], crop, actor), 201);
      }

      if (method === "GET" && p[2] === "usage") {
        const refs = await db()
          .select()
          .from(tables.mediaRefs)
          .where(eq(tables.mediaRefs.mediaId, p[1]));
        return json(refs);
      }
      if (method === "GET")
        return json(
          await db()
            .select()
            .from(tables.media)
            .orderBy(desc(tables.media.createdAt)),
        );
      if (method === "POST") {
        // Read a bounded stream before multipart parsing, including chunked uploads.
        const reader = request.body?.getReader();
        if (!reader) throw new CmsError("Upload kosong");
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > 101 * 1024 * 1024) {
            await reader.cancel();
            throw new CmsError("Upload terlalu besar", 413);
          }
          chunks.push(value);
        }
        const form = await new Response(Buffer.concat(chunks), {
          headers: {
            "Content-Type": request.headers.get("content-type") ?? "",
          },
        }).formData();
        const file = form.get("file");
        if (!(file instanceof File)) throw new CmsError("File tidak ditemukan");
        return json(await uploadMedia(file, actor), 201);
      }
      if (method === "PUT") {
        const b = z
          .object({
            alt: z.string().max(1000),
            caption: z.string().max(3000),
            labels: z.array(z.string().max(80)).max(30),
            focalX: z.number().int().min(0).max(100),
            focalY: z.number().int().min(0).max(100),
          })
          .strict()
          .parse(await readBody(request));
        await db().update(tables.media).set(b).where(eq(tables.media.id, p[1]));
        return json({ ok: true });
      }
      if (method === "DELETE") {
        await deleteMedia(
          p[1],
          actor,
          new URL(request.url).searchParams.get("permanent") === "1",
        );
        return json({ ok: true });
      }
    }
    if (p[0] === "messages") {
      if (p[2] === "deliveries" && method === "GET")
        return json(
          await db()
            .select({
              id: tables.jobs.id,
              type: tables.jobs.type,
              status: tables.jobs.status,
              attempts: tables.jobs.attempts,
              error: tables.jobs.error,
              createdAt: tables.jobs.createdAt,
              updatedAt: tables.jobs.updatedAt,
            })
            .from(tables.jobs)
            .where(sql`${tables.jobs.payload}->>'messageId' = ${p[1]}`)
            .orderBy(desc(tables.jobs.createdAt)),
        );

      if (method === "GET")
        return json(
          await db()
            .select()
            .from(tables.messages)
            .orderBy(desc(tables.messages.createdAt)),
        );
      if (method === "PUT") {
        const b = z
          .object({
            status: z.enum(["unread", "read", "archived", "spam", "trash"]),
            notes: z.string().max(10000),
          })
          .strict()
          .parse(await readBody(request));
        await db()
          .update(tables.messages)
          .set({ ...b, updatedAt: new Date() })
          .where(eq(tables.messages.id, p[1]));
        await logAudit(actor, "message.update", p[1]);
        return json({ ok: true });
      }
    }
    if (p[0] === "audit" && method === "GET")
      return json(
        await db()
          .select()
          .from(tables.audit)
          .orderBy(desc(tables.audit.createdAt))
          .limit(500),
      );
    if (p[0] === "jobs" && method === "GET")
      return json(
        await db()
          .select({
            id: tables.jobs.id,
            type: tables.jobs.type,
            status: tables.jobs.status,
            attempts: tables.jobs.attempts,
            error: tables.jobs.error,
            createdAt: tables.jobs.createdAt,
          })
          .from(tables.jobs)
          .orderBy(desc(tables.jobs.createdAt))
          .limit(200),
      );
    if (p[0] === "secrets") {
      if (method === "GET")
        return json(
          await db()
            .select({
              key: tables.secrets.key,
              updatedAt: tables.secrets.updatedAt,
            })
            .from(tables.secrets),
        );
      if (method === "PUT") {
        const b = z
          .object({
            key: z.enum(["smtp-password", "resend-key"]),
            value: z.string().min(1).max(4096),
          })
          .parse(await readBody(request));
        await setSecret(b.key, b.value, actor);
        return json({ ok: true });
      }
    }
    if (p[0] === "integrations" && method === "POST") {
      await requireOwner({ headers: request.headers, fresh: true });
      const b = z
        .object({
          settings: contactSettingsSchema,
          testEmail: z.boolean().optional(),
        })
        .parse(await readBody(request));
      if (b.testEmail) {
        await sendConfiguredMail(
          b.settings,
          {
            to: b.settings.to,
            subject: "Portfolio CMS · Test email",
            text: "Konfigurasi pengiriman email berhasil digunakan.",
            id: randomUUID(),
          },
          true,
        );
        await recordContactTest(b.settings);
        await logAudit(actor, "integration.test-email", undefined, {
          provider: b.settings.provider,
        });
        return json({ ok: true });
      }
      const result = await testConnection(b.settings);
      if (b.settings.provider === "smtp") await recordContactTest(b.settings);
      return json(result);
    }
    if (p[0] === "backups") {
      if (method === "GET")
        return json(
          await db()
            .select()
            .from(tables.backups)
            .orderBy(desc(tables.backups.createdAt)),
        );
      if (method === "POST") {
        const id = randomUUID();
        await db()
          .insert(tables.jobs)
          .values({ id, type: "backup", payload: { actor } });
        await logAudit(actor, "backup.queued", id);
        return json({ id, status: "queued" }, 202);
      }
    }
    if (p[0] === "diagnostics" && method === "GET") {
      await db().execute(sql`select 1`);
      const [worker] = await db()
        .select()
        .from(tables.system)
        .where(eq(tables.system.key, "worker-heartbeat"));
      return json({
        database: true,
        content: await contentDiagnostics(),
        storage: await storageStatus(),
        worker: worker?.updatedAt ?? null,
        contentSource: process.env.CMS_CONTENT_SOURCE ?? "files",
        backups: await db()
          .select()
          .from(tables.backups)
          .orderBy(desc(tables.backups.createdAt))
          .limit(10),
      });
    }
    if (p[0] === "export" && method === "GET")
      return json({
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        entries: (await listEntries()).map((e) => ({
          id: e.id,
          document: e.draft,
        })),
        containsSecrets: false,
      });
    if (p[0] === "import" && method === "POST") {
      const b = z
        .object({
          schemaVersion: z.literal(1),
          entries: z.array(z.object({ document: z.unknown() })).max(500),
          dryRun: z.boolean().default(true),
        })
        .parse(await readBody(request, 10 * 1024 * 1024));
      const docs = b.entries.map((e) => validateDocument(e.document));
      for (const d of docs) await validatePolicies(d);
      const current = await listEntries();
      const conflicts = docs
        .filter((d) =>
          current.some((e) => e.kind === d.kind && e.slug === d.slug),
        )
        .map((d) => `${d.kind}/${d.slug}`);
      if (b.dryRun)
        return json({
          valid: true,
          count: docs.length,
          conflicts,
          mode: "create-drafts-only",
        });
      if (conflicts.length)
        throw new CmsError(`Slug konflik: ${conflicts.join(", ")}`, 409);
      await db().transaction(async (tx) => {
        for (const d of docs) {
          const id = randomUUID();
          await tx.insert(tables.entries).values({
            id,
            kind: d.kind,
            title: d.title,
            slug: d.slug,
            draft: d,
          });
          await tx.insert(tables.revisions).values({
            id: randomUUID(),
            entryId: id,
            version: 1,
            document: d,
            actor,
            reason: "import",
          });
        }
        await tx.insert(tables.audit).values({
          id: randomUUID(),
          actor,
          action: "import",
          details: { count: docs.length },
        });
      });
      return json({ imported: docs.length });
    }
    if (p[0] === "cache" && method === "POST") {
      revalidatePath("/", "layout");
      await logAudit(actor, "cache.invalidate");
      return json({ ok: true });
    }
    if (p[0] === "redirects") {
      if (method === "GET")
        return json(await db().select().from(tables.redirects));
      if (method === "POST") {
        const b = z
          .object({
            source: z.string().regex(/^\/(?!\/)[a-z0-9/-]+$/),
            destination: z.string().regex(/^\/(?!\/)[a-z0-9/-]+$/),
          })
          .parse(await readBody(request));
        if (
          b.source === b.destination ||
          /^\/(admin|api|media)(\/|$)/.test(b.source)
        )
          throw new CmsError("Redirect tidak valid");
        const all = await db().select().from(tables.redirects);
        let next = b.destination;
        const seen = new Set([b.source]);
        for (let i = 0; i <= all.length; i++) {
          if (seen.has(next)) throw new CmsError("Redirect loop");
          seen.add(next);
          const r = all.find((r) => r.source === next);
          if (!r) break;
          next = r.destination;
        }
        await db()
          .insert(tables.redirects)
          .values(b)
          .onConflictDoUpdate({
            target: tables.redirects.source,
            set: { destination: b.destination },
          });
        return json({ ok: true });
      }
    }
    throw new CmsError("Endpoint tidak ditemukan", 404);
  } catch (error) {
    return errorResponse(error);
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;

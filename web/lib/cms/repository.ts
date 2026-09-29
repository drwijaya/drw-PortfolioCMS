import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import {
  audit,
  entries,
  revisions,
  mediaRefs,
  media,
  redirects,
  jobs,
  secrets,
} from "./db-schema";
import {
  type EntryKind,
  validateDocument,
  mediaIds,
  publicPath,
} from "./model";
export class CmsError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export async function logAudit(
  actor: string,
  action: string,
  target?: string,
  details: Record<string, unknown> = {},
) {
  await db()
    .insert(audit)
    .values({ id: randomUUID(), actor, action, target, details });
}
export async function listEntries(kind?: EntryKind) {
  return db()
    .select()
    .from(entries)
    .where(kind ? eq(entries.kind, kind) : undefined)
    .orderBy(desc(entries.updatedAt));
}
export async function getEntry(id: string) {
  const [row] = await db().select().from(entries).where(eq(entries.id, id));
  if (!row) throw new CmsError("Konten tidak ditemukan", 404);
  return row;
}
export async function publishedEntries(kind: EntryKind) {
  return db()
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.kind, kind),
        isNotNull(entries.published),
        isNull(entries.trashedAt),
      ),
    );
}
export async function publishedDocument(kind: EntryKind, slug: string) {
  const rows = await publishedEntries(kind);
  return rows.find((r) => r.published?.slug === slug)?.published ?? null;
}
export async function createEntry(
  input: unknown,
  actor: string,
  id = randomUUID(),
) {
  const doc = validateDocument(input);
  if(["profile","navigation","appearance","settings"].includes(doc.kind)&&(await listEntries(doc.kind)).length)throw new CmsError("Pengaturan tunggal sudah tersedia",409);
  await db().transaction(async (tx) => {
    await tx
      .insert(entries)
      .values({
        id,
        kind: doc.kind,
        title: doc.title,
        slug: doc.slug,
        draft: doc,
      });
    await tx
      .insert(revisions)
      .values({
        id: randomUUID(),
        entryId: id,
        version: 1,
        document: doc,
        actor,
        reason: "create",
      });
    for (const mediaId of mediaIds(doc)) {
      const [asset] = await tx
        .select()
        .from(media)
        .where(eq(media.id, mediaId));
      if (!asset || asset.trashedAt) throw new CmsError("Media tidak tersedia");
      await tx
        .insert(mediaRefs)
        .values({
          id: randomUUID(),
          mediaId,
          entryId: id,
          visibility: "draft",
        });
    }
    await tx
      .insert(audit)
      .values({ id: randomUUID(), actor, action: "entry.create", target: id });
  });
  return getEntry(id);
}
export async function saveEntry(
  id: string,
  input: unknown,
  version: number,
  actor: string,
  reason = "save",
) {
  const doc = validateDocument(input);
  await db().transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(entries)
      .where(eq(entries.id, id))
      .for("update");
    if (!current) throw new CmsError("Konten tidak ditemukan", 404);
    if (current.version !== version)
      throw new CmsError(
        "Konten sudah berubah di tab lain. Muat revisi terbaru sebelum menyimpan.",
        409,
      );
    if(["profile","navigation","appearance","settings","collection"].includes(current.kind)&&current.slug!==doc.slug)throw new CmsError("Identitas konfigurasi tidak dapat diubah");
    if (current.kind !== doc.kind)
      throw new CmsError("Jenis konten tidak dapat diubah");
    if (current.trashedAt)
      throw new CmsError("Pulihkan konten dari trash terlebih dahulu");
    await tx
      .update(entries)
      .set({
        draft: doc,
        title: doc.title,
        slug: doc.slug,
        version: version + 1,
        scheduledAt: null,
        scheduledVersion: null,
        updatedAt: new Date(),
      })
      .where(eq(entries.id, id));
    await tx
      .insert(revisions)
      .values({
        id: randomUUID(),
        entryId: id,
        version: version + 1,
        document: doc,
        actor,
        reason,
      });
    await tx
      .delete(mediaRefs)
      .where(and(eq(mediaRefs.entryId, id), eq(mediaRefs.visibility, "draft")));
    for (const mediaId of mediaIds(doc)) {
      const [asset] = await tx
        .select({ id: media.id })
        .from(media)
        .where(eq(media.id, mediaId));
      if (!asset) throw new CmsError("Media tidak ditemukan");
      await tx
        .insert(mediaRefs)
        .values({
          id: randomUUID(),
          mediaId,
          entryId: id,
          visibility: "draft",
        });
    }
    if (reason !== "autosave")
      await tx
        .insert(audit)
        .values({
          id: randomUUID(),
          actor,
          action: `entry.${reason}`,
          target: id,
          details: { version: version + 1 },
        });
  });
  return getEntry(id);
}
export async function publishEntry(id: string, version: number, actor: string) {
  await db().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(entries)
      .where(eq(entries.id, id))
      .for("update");
    if (!row) throw new CmsError("Konten tidak ditemukan", 404);
    if (row.version !== version)
      throw new CmsError("Revisi berubah. Tinjau ulang sebelum publish.", 409);
    if (row.trashedAt) throw new CmsError("Konten dalam trash");
    const doc = validateDocument(row.draft, true);
    // Kind-specific policies include theme contrast and immutable game identities.
    const { validatePolicies } = await import("./policies");
    await validatePolicies(doc,id);
    if (doc.kind === "settings") {
      const settings = doc.data.contact as import("./mail").MailSettings;
      const key = settings.provider === "smtp" ? "smtp-password" : "resend-key";
      const [pending] = await tx
        .select()
        .from(secrets)
        .where(eq(secrets.key, `${key}-pending`)).for("update");
      if (
        pending ||
        JSON.stringify(row.published?.data.contact) !== JSON.stringify(settings)
      ) {
        const { requireContactTest } = await import("./integration-test");
        await requireContactTest(settings);
        if (pending) {
          await tx
            .insert(secrets)
            .values({ key, encrypted: pending.encrypted })
            .onConflictDoUpdate({
              target: secrets.key,
              set: { encrypted: pending.encrypted, updatedAt: new Date() },
            });
          await tx.delete(secrets).where(eq(secrets.key, pending.key));
        }
      }
    }
    const path = publicPath(doc),
      oldPath = row.published ? publicPath(row.published) : null;
    if (path && ["work", "post", "page"].includes(doc.kind)) {
      const all = await tx
        .select()
        .from(entries)
        .where(and(isNotNull(entries.published), isNull(entries.trashedAt)));
      if (
        all.some(
          (e) => e.id !== id && e.published && publicPath(e.published) === path,
        )
      )
        throw new CmsError("URL sudah digunakan");
      await tx.delete(redirects).where(eq(redirects.source, path));
      if (oldPath && oldPath !== path) {
        await tx
          .update(redirects)
          .set({ destination: path })
          .where(eq(redirects.destination, oldPath));
        await tx
          .insert(redirects)
          .values({ source: oldPath, destination: path })
          .onConflictDoUpdate({
            target: redirects.source,
            set: { destination: path },
          });
      }
    }
    await tx
      .update(entries)
      .set({
        published: doc,
        publishedVersion: version,
        publishedAt: new Date(),
        scheduledAt: null,
        scheduledVersion: null,
        updatedAt: new Date(),
      })
      .where(eq(entries.id, id));
    await tx
      .delete(mediaRefs)
      .where(
        and(eq(mediaRefs.entryId, id), eq(mediaRefs.visibility, "public")),
      );
    for (const mediaId of mediaIds(doc)) {
      const [asset] = await tx
        .select()
        .from(media)
        .where(eq(media.id, mediaId));
      if (!asset || asset.trashedAt) throw new CmsError("Media belum tersedia");
      await tx
        .insert(mediaRefs)
        .values({
          id: randomUUID(),
          mediaId,
          entryId: id,
          visibility: "public",
        });
    }
    await tx
      .insert(jobs)
      .values({
        id: randomUUID(),
        type: "invalidate",
        payload: { entryId: id, paths: [path, oldPath].filter(Boolean) },
      });
    await tx
      .insert(audit)
      .values({
        id: randomUUID(),
        actor,
        action: "entry.publish",
        target: id,
        details: { version },
      });
  });
  return getEntry(id);
}
export async function entryAction(
  id: string,
  action: string,
  version: number,
  actor: string,
  options: { at?: string; revision?: number } = {},
) {
  if (action === "publish") return publishEntry(id, version, actor);
  if (action === "restore-revision") {
    const [r] = await db()
      .select()
      .from(revisions)
      .where(
        and(
          eq(revisions.entryId, id),
          eq(revisions.version, options.revision ?? 0),
        ),
      );
    if (!r) throw new CmsError("Revisi tidak ditemukan", 404);
    return saveEntry(id, r.document, version, actor, "restore-revision");
  }
  await db().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(entries)
      .where(eq(entries.id, id))
      .for("update");
    if (!row) throw new CmsError("Konten tidak ditemukan", 404);
    if (row.version !== version) throw new CmsError("Versi berubah", 409);
    if (action === "schedule") {
      const at = new Date(options.at ?? "");
      if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now())
        throw new CmsError("Pilih waktu di masa depan");
      validateDocument(row.draft, true);
      await tx
        .update(entries)
        .set({ scheduledAt: at, scheduledVersion: version })
        .where(eq(entries.id, id));
    } else if (action === "unpublish" || action === "trash") {
      if (
        [
          "profile",
          "navigation",
          "appearance",
          "settings",
          "collection",
        ].includes(row.kind)
      )
        throw new CmsError(
          "Pengaturan inti tidak dapat dihapus; gunakan revisi",
        );
      await tx
        .update(entries)
        .set({
          published: null,
          publishedVersion: null,
          scheduledAt: null,
          scheduledVersion: null,
          trashedAt: action === "trash" ? new Date() : null,
        })
        .where(eq(entries.id, id));
      await tx
        .delete(mediaRefs)
        .where(
          and(eq(mediaRefs.entryId, id), eq(mediaRefs.visibility, "public")),
        );
    } else if (action === "restore")
      await tx
        .update(entries)
        .set({ trashedAt: null })
        .where(eq(entries.id, id));
    else if (action === "delete") {
      if (!row.trashedAt)
        throw new CmsError("Pindahkan ke trash terlebih dahulu");
      await tx.delete(entries).where(eq(entries.id, id));
    } else if (action === "cancel-schedule")
      await tx
        .update(entries)
        .set({ scheduledAt: null, scheduledVersion: null })
        .where(eq(entries.id, id));
    else throw new CmsError("Tindakan tidak dikenal");
    await tx
      .insert(audit)
      .values({
        id: randomUUID(),
        actor,
        action: `entry.${action}`,
        target: id,
      });
  });
  return action === "delete" ? null : getEntry(id);
}
export async function entryRevisions(id: string) {
  return db()
    .select()
    .from(revisions)
    .where(eq(revisions.entryId, id))
    .orderBy(desc(revisions.version));
}
export async function dashboard() {
  const [counts, unread, failed, recent] = await Promise.all([
    db()
      .select({ kind: entries.kind, count: sql<number>`count(*)::int` })
      .from(entries)
      .groupBy(entries.kind),
    db().execute(
      sql`select count(*)::int as count from cms_messages where status='unread'`,
    ),
    db().select().from(jobs).where(eq(jobs.status, "failed")),
    db().select().from(audit).orderBy(desc(audit.createdAt)).limit(12),
  ]);
  return {
    counts,
    unread: unread.rows[0]?.count ?? 0,
    failed: failed.length,
    recent,
  };
}

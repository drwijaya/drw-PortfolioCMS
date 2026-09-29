import { eq } from "drizzle-orm";
import { db } from "./db";
import { system } from "./db-schema";
import { CmsError, getEntry } from "./repository";
const reviewKey = (sessionId: string, entryId: string) =>
  `review:${sessionId}:${entryId}`;
export async function markPreview(
  sessionId: string,
  entryId: string,
  version: number,
) {
  await db()
    .insert(system)
    .values({
      key: reviewKey(sessionId, entryId),
      value: { version, preview: true, review: false },
    })
    .onConflictDoUpdate({
      target: system.key,
      set: {
        value: { version, preview: true, review: false },
        updatedAt: new Date(),
      },
    });
}
export async function reviewEntry(
  sessionId: string,
  entryId: string,
  version: number,
) {
  const entry = await getEntry(entryId);
  if (entry.version !== version)
    throw new CmsError("Revisi berubah. Preview ulang sebelum review.", 409);
  const [record] = await db()
    .select()
    .from(system)
    .where(eq(system.key, reviewKey(sessionId, entryId)));
  const value = record?.value as
    { version?: number; preview?: boolean } | undefined;
  if (value?.version !== version || !value.preview)
    throw new CmsError("Buka preview versi ini terlebih dahulu.", 409);
  await db()
    .update(system)
    .set({ value: { ...value, review: true }, updatedAt: new Date() })
    .where(eq(system.key, record.key));
}
export async function requireReview(
  sessionId: string,
  entryId: string,
  version: number,
) {
  const [record] = await db()
    .select()
    .from(system)
    .where(eq(system.key, reviewKey(sessionId, entryId)));
  const value = record?.value as
    { version?: number; review?: boolean } | undefined;
  if (value?.version !== version || !value.review)
    throw new CmsError(
      "Preview dan review revisi ini sebelum publish atau menjadwalkan.",
      409,
    );
}

export async function clearReview(sessionId: string, entryId: string) {
  await db()
    .delete(system)
    .where(eq(system.key, reviewKey(sessionId, entryId)));
}

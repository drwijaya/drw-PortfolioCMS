import { connection } from "next/server";
import { headers } from "next/headers";
import { cache } from "react";
import { cmsEnabled } from "./db";
import { publishedDocument, publishedEntries, getEntry } from "./repository";
import { requireOwner } from "./security";
import type { EntryKind } from "./model";
const previewDocument = cache(async () => {
  const id = (await headers()).get("x-cms-preview-entry");
  if (!id) return null;
  await requireOwner();
  return (await getEntry(id)).draft;
});
export const readDocument = cache(async (kind: EntryKind, slug: string) => {
  if (!cmsEnabled()) return null;
  await connection();
  const preview = await previewDocument();
  if (preview?.kind === kind && preview.slug === slug) return preview;
  return publishedDocument(kind, slug);
});
export const readDocuments = cache(async (kind: EntryKind) => {
  if (!cmsEnabled()) return [];
  await connection();
  const preview = await previewDocument(),
    docs = (await publishedEntries(kind)).map((r) => r.published!);
  return preview?.kind === kind
    ? [...docs.filter((d) => d.slug !== preview.slug), preview]
    : docs;
});
export async function profileData() {
  const doc = await readDocument("profile", "owner");
  if (!doc)
    throw new Error(
      "CMS owner profile is missing. Complete migration before activation.",
    );
  return doc.data;
}
export async function siteSettings() {
  return (await readDocument("settings", "site"))?.data ?? null;
}

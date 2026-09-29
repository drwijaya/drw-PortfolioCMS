import { stat } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { media, entries } from "./db-schema";
import { mediaRoot } from "./media";
import { publicPath } from "./model";
export async function contentDiagnostics() {
  const assets = await db().select().from(media),
    documents = await db().select().from(entries),
    brokenMedia: { id: string; name: string }[] = [],
    brokenLinks: { entryId: string; url: string }[] = [];
  for (const asset of assets) {
    try {
      for (const variant of asset.variants)
        await stat(path.join(mediaRoot(), asset.id, variant));
    } catch {
      brokenMedia.push({ id: asset.id, name: asset.name });
    }
  }
  const routes = new Set([
    "/",
    "/blog",
    "/analytics",
    "/playground/offtheclock",
    ...["music", "film", "games", "homelab", "booth"].map(
      (r) => `/playground/offtheclock/${r}`,
    ),
    ...documents
      .filter((e) => e.published && !e.trashedAt)
      .map((e) => publicPath(e.published!))
      .filter(Boolean),
  ]);
  for (const e of documents) {
    if (!e.published || e.trashedAt) continue;
    const urls = [
      ...new Set(
        [
          ...JSON.stringify(e.published).matchAll(
            /(?:href|destination|src|artwork|thumb|hero|photo)"\s*:\s*"(\/[^"\s]*)"/g,
          ),
        ].map((m) => m[1]),
      ),
    ];
    for (const url of urls) {
      const pathname = url.split(/[?#]/)[0];
      if (
        routes.has(pathname) ||
        pathname.startsWith("/media/") ||
        pathname.includes("/journal/")
      )
        continue;
      const file = path.resolve(process.cwd(), "public", `.${pathname}`);
      if (!file.startsWith(path.join(process.cwd(), "public") + path.sep))
        continue;
      try {
        await stat(file);
      } catch {
        brokenLinks.push({ entryId: e.id, url });
      }
    }
  }
  const size = await db().execute(
    sql`select pg_database_size(current_database())::text as bytes`,
  );
  return {
    databaseBytes: Number(size.rows[0]?.bytes ?? 0),
    mediaBytes: assets.reduce((n, a) => n + a.bytes, 0),
    mediaCount: assets.length,
    brokenMedia,
    brokenLinks,
  };
}

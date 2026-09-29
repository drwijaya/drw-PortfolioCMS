import { db, getPool } from "../../lib/cms/db";
import { entries, revisions, system } from "../../lib/cms/db-schema";
import { seedDocuments, seedId } from "../../lib/cms/seed";
import { validateDocument } from "../../lib/cms/model";
let inserted = 0;
await db().transaction(async (tx) => {
  for (const doc of seedDocuments()) {
    validateDocument(doc, true);
    const id = seedId(`${doc.kind}/${doc.slug}`);
    const added = await tx
      .insert(entries)
      .values({
        id,
        kind: doc.kind,
        title: doc.title,
        slug: doc.slug,
        draft: doc,
        published: doc,
        publishedVersion: 1,
        publishedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: entries.id });
    if (added.length) {
      inserted++;
      await tx
        .insert(revisions)
        .values({
          id: seedId(`revision/${id}/1`),
          entryId: id,
          version: 1,
          document: doc,
          actor: "migration",
          reason: "initial-import",
        });
    }
  }
  await tx
    .insert(system)
    .values({ key: "seed-complete", value: { schemaVersion: 1 } })
    .onConflictDoNothing();
});
console.log(`Imported ${inserted} new records; existing records preserved`);
await getPool().end();

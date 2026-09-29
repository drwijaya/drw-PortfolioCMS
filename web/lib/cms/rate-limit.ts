import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { rateLimit } from "./db-schema";
import { CmsError } from "./repository";
export async function takeLimit(key: string, max = 5, seconds = 900) {
  const allowed = await db().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
    const [row] = await tx
      .select()
      .from(rateLimit)
      .where(eq(rateLimit.key, key));
    const now = Date.now(),
      expired = !row || now - row.lastRequest >= seconds * 1000;
    if (row && !expired && row.count >= max) return false;
    await tx
      .insert(rateLimit)
      .values({ id: randomUUID(), key, count: 1, lastRequest: now })
      .onConflictDoUpdate({
        target: rateLimit.key,
        set: {
          count: expired ? 1 : (row?.count ?? 0) + 1,
          lastRequest: expired ? now : row!.lastRequest,
        },
      });
    return true;
  });
  if (!allowed)
    throw new CmsError(
      "Terlalu banyak percobaan. Coba lagi setelah 15 menit.",
      429,
    );
}

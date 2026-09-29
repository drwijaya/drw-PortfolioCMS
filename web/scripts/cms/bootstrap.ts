import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db, getPool } from "../../lib/cms/db";
import { user, account } from "../../lib/cms/db-schema";
import { sql } from "drizzle-orm";
const email = process.env.CMS_OWNER_EMAIL,
  password = process.env.CMS_BOOTSTRAP_PASSWORD;
if (!email || !password || password.length < 16)
  throw new Error(
    "Set CMS_OWNER_EMAIL and CMS_BOOTSTRAP_PASSWORD (16+ characters) through a secure environment",
  );
await db().transaction(async (tx) => {
  await tx.execute(sql`select pg_advisory_xact_lock(740218)`);
  if ((await tx.select().from(user)).length)
    throw new Error("Owner already exists; bootstrap is permanently closed");
  const id = randomUUID();
  await tx
    .insert(user)
    .values({
      id,
      name: "Owner",
      email: email.toLowerCase(),
      emailVerified: true,
      twoFactorEnabled: false,
    });
  await tx
    .insert(account)
    .values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: await hashPassword(password),
    });
});
console.log(
  "Owner created. Complete authenticator enrollment on /admin before accessing content.",
);
await getPool().end();

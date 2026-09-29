import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { db, getPool } from "../../lib/cms/db";
import { user, account, twoFactor, session } from "../../lib/cms/db-schema";
import { logAudit } from "../../lib/cms/repository";
try {
  const email = process.env.CMS_OWNER_EMAIL,
    password = process.env.CMS_RECOVERY_PASSWORD;
  if (
    process.argv[2] !== "--reset-owner-factors" ||
    !email ||
    !password ||
    password.length < 16
  )
    throw new Error(
      "Local recovery requires --reset-owner-factors, CMS_OWNER_EMAIL and CMS_RECOVERY_PASSWORD (16+ characters)",
    );
  const [owner] = await db().select().from(user).where(eq(user.email, email));
  if (!owner) throw new Error("Owner not found");
  const hash = await hashPassword(password);
  await db().transaction(async (tx) => {
    await tx.delete(session).where(eq(session.userId, owner.id));
    await tx.delete(twoFactor).where(eq(twoFactor.userId, owner.id));
    await tx
      .update(account)
      .set({ password: hash, updatedAt: new Date() })
      .where(eq(account.userId, owner.id));
    await tx
      .update(user)
      .set({ twoFactorEnabled: false, updatedAt: new Date() })
      .where(eq(user.id, owner.id));
  });
  await logAudit(owner.id, "auth.local-recovery");
  console.log(
    "All sessions revoked. Sign in with the new password and enroll a new authenticator before accessing CMS data.",
  );
} finally {
  await getPool().end();
}

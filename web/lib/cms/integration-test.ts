import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { secrets, system } from "./db-schema";
import type { MailSettings } from "./mail";
export async function contactFingerprint(settings: MailSettings) {
  const key = settings.provider === "smtp" ? "smtp-password" : "resend-key";
  const rows = await db().select().from(secrets);
  const credential =
    rows.find((r) => r.key === `${key}-pending`) ??
    rows.find((r) => r.key === key);
  return createHash("sha256")
    .update(JSON.stringify(settings))
    .update(credential?.encrypted ?? "deployment-credential")
    .digest("hex");
}
export async function recordContactTest(settings: MailSettings) {
  const fingerprint = await contactFingerprint(settings);
  await db()
    .insert(system)
    .values({ key: "contact-tested", value: { fingerprint } })
    .onConflictDoUpdate({
      target: system.key,
      set: { value: { fingerprint }, updatedAt: new Date() },
    });
}
export async function requireContactTest(settings: MailSettings) {
  const [row] = await db()
    .select()
    .from(system)
    .where(eq(system.key, "contact-tested"));
  if (
    (row?.value as { fingerprint?: string })?.fingerprint !==
    (await contactFingerprint(settings))
  )
    throw new Error(
      "Test connection atau test email konfigurasi ini terlebih dahulu di Integrations",
    );
}

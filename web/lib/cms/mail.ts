import { lookup } from "node:dns/promises";
import nodemailer from "nodemailer";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "./db";
import { secrets } from "./db-schema";
import { encrypt, decrypt } from "./crypto";
import { contactSettingsSchema } from "./policies";
import { publishedDocument, logAudit } from "./repository";
export type MailSettings = z.infer<typeof contactSettingsSchema>;
export async function setSecret(key: string, value: string, actor: string) {
  if (!["smtp-password", "resend-key"].includes(key))
    throw new Error("Unknown secret");
  key += "-pending";
  await db()
    .insert(secrets)
    .values({ key, encrypted: encrypt(value) })
    .onConflictDoUpdate({
      target: secrets.key,
      set: { encrypted: encrypt(value), updatedAt: new Date() },
    });
  await logAudit(actor, "secret.replace", key);
}
export async function secretValue(key: string, pending = false) {
  if (pending) {
    const [draft] = await db()
      .select()
      .from(secrets)
      .where(eq(secrets.key, `${key}-pending`));
    if (draft) return decrypt(draft.encrypted);
  }
  const [row] = await db().select().from(secrets).where(eq(secrets.key, key));
  return row ? decrypt(row.encrypted) : undefined;
}
export async function mailSettings() {
  const doc = await publishedDocument("settings", "site");
  const settings = contactSettingsSchema.parse(doc?.data.contact);
  if (!settings.host && settings.provider === "smtp")
    return {
      ...settings,
      host: process.env.SMTP_HOST ?? "",
      port: Number(process.env.SMTP_PORT ?? 587),
      username: process.env.SMTP_USER ?? "",
      from:
        process.env.CONTACT_FROM ||
        process.env.SMTP_USER ||
        process.env.CONTACT_TO ||
        "",
      to: process.env.CONTACT_TO ?? "",
    };
  return settings;
}
export async function assertContactConfig(settings: MailSettings) {
  if (!settings.host && settings.provider === "smtp") return;
  if (settings.provider === "smtp") {
    const allowed = (
      process.env.CMS_SMTP_ALLOWED_HOSTS ??
      process.env.SMTP_HOST ??
      ""
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!allowed.includes(settings.host))
      throw new Error("SMTP host belum diizinkan di konfigurasi deployment");
    if (![465, 587, 2525].includes(settings.port))
      throw new Error("Gunakan port SMTP TLS 465, 587, atau 2525");
    if (!settings.tls) throw new Error("TLS wajib untuk SMTP");
    await lookup(settings.host);
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.from) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.to)
  )
    throw new Error("Alamat pengirim/penerima tidak valid");
}
export async function sendConfiguredMail(
  settings: MailSettings,
  message: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    replyTo?: string;
    id: string;
  },
  pending = false,
) {
  await assertContactConfig(settings);
  if (settings.provider === "smtp" && !settings.host)
    throw new Error("SMTP belum dikonfigurasi");
  if (settings.provider === "resend") {
    const key = await secretValue("resend-key", pending);
    if (!key) throw new Error("API key belum diatur");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.id,
      },
      body: JSON.stringify({
        from: `${settings.senderName} <${settings.from}>`,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
        reply_to: message.replyTo,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Email API returned ${response.status}`);
  } else {
    const pass =
      (await secretValue("smtp-password", pending)) ?? process.env.SMTP_PASS;
    const mailer = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.port === 465,
      requireTLS: settings.port !== 465,
      tls: { rejectUnauthorized: true },
      auth: settings.username ? { user: settings.username, pass } : undefined,
      connectionTimeout: 10000,
      socketTimeout: 20000,
    });
    try {
      await mailer.sendMail({
        from: { name: settings.senderName, address: settings.from },
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
        messageId: `<${message.id}@portfolio.local>`,
      });
    } finally {
      mailer.close();
    }
  }
}
export async function testConnection(settings: MailSettings, pending = true) {
  await assertContactConfig(settings);
  if (settings.provider === "smtp" && !settings.host)
    throw new Error("SMTP belum dikonfigurasi");
  if (settings.provider === "resend") {
    if (!(await secretValue("resend-key", pending)))
      throw new Error("API key belum diatur");
    return {
      ok: true,
      note: "API key tersedia. Gunakan test email untuk memverifikasi pengiriman.",
    };
  }
  const pass =
    (await secretValue("smtp-password", pending)) ?? process.env.SMTP_PASS;
  const t = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    requireTLS: settings.port !== 465,
    auth: settings.username ? { user: settings.username, pass } : undefined,
    connectionTimeout: 10000,
  });
  try {
    await t.verify();
    return { ok: true };
  } finally {
    t.close();
  }
}

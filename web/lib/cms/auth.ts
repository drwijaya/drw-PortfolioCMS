import { trustedCmsOrigins } from "./origins";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db-schema";
let instance: ReturnType<typeof createAuth> | undefined;
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Authentication is not configured");
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin) throw new Error("BETTER_AUTH_URL is required");
  return betterAuth({
    appName: "Portfolio Admin",
    baseURL: origin,
    secret,
    database: drizzleAdapter(db(), { provider: "pg", schema }),
    trustedOrigins: trustedCmsOrigins(),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 16,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 8 * 60 * 60,
      updateAge: 60 * 60 * 24,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 900, max: 5 },
        "/two-factor/verify-totp": { window: 900, max: 5 },
        "/two-factor/verify-backup-code": { window: 900, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: origin.startsWith("https://"),
      defaultCookieAttributes: { httpOnly: true, sameSite: "strict" },
      ipAddress: {
        ipAddressHeaders:
          process.env.NODE_ENV === "production" ? ["cf-connecting-ip"] : [],
      },
    },
    plugins: [
      twoFactor({
        issuer: "Portfolio Admin",
        backupCodeOptions: {
          storeBackupCodes: "encrypted",
          amount: 10,
          length: 16,
        },
        totpOptions: { digits: 6, period: 30 },
      }),
    ],
  });
}
export function auth() {
  return (instance ??= createAuth());
}

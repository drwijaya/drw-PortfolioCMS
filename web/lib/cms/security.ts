import { trustedCmsOrigins } from "./origins";
import { createRemoteJWKSet } from "jose";
import { accessToken, verifyAccessToken } from "./access-token";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { session, sessionPolicy } from "./db-schema";
import { CmsError } from "./repository";
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
export async function accessGate(h: Headers, allowAccessCookie = false) {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.CMS_ACCESS_MODE === "app") return;
  if (process.env.CMS_ACCESS_MODE && process.env.CMS_ACCESS_MODE !== "cloudflare")
    throw new CmsError("Mode keamanan admin tidak valid", 503);
  const issuer = process.env.CF_ACCESS_ISSUER,
    audience = process.env.CF_ACCESS_AUD,
    owner = process.env.CMS_OWNER_EMAIL;
  if (
    !issuer ||
    !audience ||
    !owner ||
    !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)
  )
    throw new CmsError("Admin belum dikonfigurasi", 503);
  const token = accessToken(h, allowAccessCookie);
  if (!token) throw new CmsError("Cloudflare Access diperlukan", 403);
  try {
    jwks ??= createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    await verifyAccessToken(token, jwks, { issuer, audience, owner });
  } catch {
    throw new CmsError("Cloudflare Access tidak valid", 403);
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || !trustedCmsOrigins().includes(origin))
    throw new CmsError("Origin ditolak", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    throw new CmsError("Cross-site request ditolak", 403);
}
export async function requireOwner(
  options: {
    headers?: Headers;
    enrollment?: boolean;
    touch?: boolean;
    fresh?: boolean;
    accessCookie?: boolean;
  } = {},
) {
  const h = options.headers ?? (await headers());
  await accessGate(h, options.accessCookie);
  const result = await auth().api.getSession({
    headers: h,
    query: { disableCookieCache: true, disableRefresh: true },
  });
  if (
    !result ||
    result.user.email.toLowerCase() !==
      process.env.CMS_OWNER_EMAIL?.toLowerCase()
  )
    throw new CmsError("Silakan login", 401);
  if (!options.enrollment && !result.user.twoFactorEnabled)
    throw new CmsError("Authenticator wajib diaktifkan", 403);
  await db()
    .insert(sessionPolicy)
    .values({
      sessionId: result.session.id,
      lastActiveAt: result.session.createdAt,
    })
    .onConflictDoNothing();
  const [policy] = await db()
    .select()
    .from(sessionPolicy)
    .where(eq(sessionPolicy.sessionId, result.session.id));
  if (
    Date.now() - policy.lastActiveAt.getTime() > 15 * 60 * 1000 ||
    Date.now() - result.session.createdAt.getTime() > 8 * 60 * 60 * 1000
  ) {
    await db().delete(session).where(eq(session.id, result.session.id));
    throw new CmsError("Session berakhir. Silakan login kembali.", 401);
  }
  if (
    options.fresh &&
    (!policy.reauthenticatedAt ||
      Date.now() - policy.reauthenticatedAt.getTime() > 5 * 60 * 1000)
  )
    throw new CmsError("Autentikasi ulang diperlukan", 428);
  if (options.touch)
    await db()
      .update(sessionPolicy)
      .set({ lastActiveAt: new Date() })
      .where(eq(sessionPolicy.sessionId, result.session.id));
  return result;
}
export function errorResponse(error: unknown) {
  const status = error instanceof CmsError ? error.status : 400;
  const message = error instanceof Error ? error.message : "Permintaan gagal";
  return Response.json(
    { error: status >= 500 ? "Layanan CMS tidak tersedia" : message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

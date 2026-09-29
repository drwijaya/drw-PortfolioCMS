import { readBody } from "@/lib/cms/http";
import { takeLimit } from "@/lib/cms/rate-limit";
import { auth } from "@/lib/cms/auth";
import {
  accessGate,
  sameOrigin,
  requireOwner,
  errorResponse,
} from "@/lib/cms/security";
import { CmsError, logAudit } from "@/lib/cms/repository";
const publicPaths = new Set([
  "sign-in/email",
  "sign-out",
  "two-factor/verify-totp",
  "two-factor/verify-backup-code",
  "get-session",
]);
const enrollPaths = new Set(["two-factor/enable", "two-factor/get-totp-uri"]);
const freshPaths = new Set([
  "change-password",
  "two-factor/generate-backup-codes",
  "revoke-session",
  "revoke-sessions",
  "revoke-other-sessions",
]);
async function handle(request: Request) {
  try {
    await accessGate(request.headers);
    const path = new URL(request.url).pathname.replace("/api/auth/", "");
    if (request.method === "POST") sameOrigin(request);
    if (enrollPaths.has(path)) {
      const owner = await requireOwner({
        headers: request.headers,
        enrollment: true,
        touch: true,
      });
      if (owner.user.twoFactorEnabled)
        throw new CmsError("Authenticator sudah aktif", 403);
    } else if (freshPaths.has(path))
      await requireOwner({
        headers: request.headers,
        fresh: true,
        touch: true,
      });
    else if (path === "list-sessions")
      await requireOwner({ headers: request.headers });
    else if (!publicPaths.has(path))
      throw new CmsError("Endpoint tidak tersedia", 404);
    if (Number(request.headers.get("content-length") ?? 0) > 16384)
      throw new CmsError("Payload terlalu besar", 413);
    if (request.method === "POST") {
      const body = await readBody(request, 16384);
      request = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(body),
      });
      if (body.trustDevice === true)
        throw new CmsError("Trusted device tidak diizinkan");
      if (path === "sign-in/email") await takeLimit("owner-password");
      if (
        path === "sign-in/email" &&
        String(body.email).toLowerCase() !==
          process.env.CMS_OWNER_EMAIL?.toLowerCase()
      )
        throw new CmsError("Email atau password tidak valid", 401);
    }
    const response = await auth().handler(request);
    response.headers.set("Cache-Control", "no-store");
    if (request.method === "POST")
      await logAudit("authentication", `auth.${path}`, undefined, {
        success: response.ok,
      });
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
export const GET = handle;
export const POST = handle;

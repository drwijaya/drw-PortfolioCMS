import { siteSettings } from "./read";
import { requireOwner } from "./security";
export async function analyticsRequest(request: Request, path: string[]) {
  const pathname = path.join("/");
  if (!["v1/collect", "v1/public/dashboard", "health"].includes(pathname))
    return new Response(null, { status: 404 });
  const settings = await siteSettings();
  if (pathname === "v1/collect" && settings?.analyticsEnabled === false)
    return Response.json({ ok: true });
  if (
    pathname === "v1/public/dashboard" &&
    settings?.analyticsPublic === false
  ) {
    try {
      await requireOwner({ headers: request.headers });
    } catch {
      return new Response(null, { status: 404 });
    }
  }
  const upstream =
    process.env.CMS_ANALYTICS_INTERNAL_URL ?? "http://analytics-api:8080";
  const target = new URL(`/${pathname}`, upstream);
  target.search = new URL(request.url).search;
  const headers = new Headers();
  for (const key of [
    "content-type",
    "origin",
    "user-agent",
    "cf-connecting-ip",
    "cf-ipcountry",
    "cf-region",
    "cf-ipcity",
    "cf-iplatitude",
    "cf-iplongitude",
  ]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (process.env.CMS_ANALYTICS_SERVICE_TOKEN)
    headers.set("x-cms-service-token", process.env.CMS_ANALYTICS_SERVICE_TOKEN);
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === "POST" ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  return new Response(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

import { cmsEnabled,db } from '@/lib/cms/db'
import { redirects } from '@/lib/cms/db-schema'
import { eq } from 'drizzle-orm'
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/_next/image") {
    let pathname: string;
    try {
      pathname = new URL(
        request.nextUrl.searchParams.get("url") ?? "",
        request.url,
      ).pathname;
    } catch {
      return new NextResponse(null, { status: 400 });
    }
    if (pathname.startsWith("/media/"))
      return new NextResponse(null, {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      });
  }
  if(cmsEnabled()&&!/^\/(admin|api|analytics-api|media|_next)(\/|$)/.test(request.nextUrl.pathname)&&!request.nextUrl.pathname.includes('.')){const [entry]=await db().select().from(redirects).where(eq(redirects.source,request.nextUrl.pathname));if(entry)return NextResponse.redirect(new URL(entry.destination,request.url),308)}
  const headers = new Headers(request.headers);
  headers.delete("x-cms-preview-entry");
  headers.delete("x-cms-preview-theme");
  const preview = /^\/admin\/preview\/([a-f0-9-]{36}|[a-f0-9]{24})$/.exec(
    request.nextUrl.pathname,
  );
  if (preview) {headers.set("x-cms-preview-entry", preview[1]);if(request.nextUrl.searchParams.get("frame")==="1")headers.set("x-cms-preview-theme",request.nextUrl.searchParams.get("theme")==="dark"?"dark":"light");}
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!_next/static|favicon.ico).*)"] };

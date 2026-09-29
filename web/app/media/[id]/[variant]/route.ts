import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { mediaFile, mediaIsPublic } from "@/lib/cms/media";
import { requireOwner, errorResponse } from "@/lib/cms/security";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; variant: string }> },
) {
  try {
    const { id, variant } = await params;
    if (!(await mediaIsPublic(id)))
      await requireOwner({ headers: request.headers, accessCookie: true });
    const { file, bytes, mime, asset } = await mediaFile(id, variant);
    const headers: Record<string, string> = {
      "Content-Type": mime,
      "Content-Length": String(bytes),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      ...(mime === "application/pdf"
        ? {
            "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(asset.name)}`,
          }
        : {}),
    };
    const range = request.headers.get("range");
    let start = 0,
      end = bytes - 1,
      status = 200;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!m || (!m[1] && !m[2]))
        return new Response(null, {
          status: 416,
          headers: {
            ...headers,
            "Content-Range": `bytes */${bytes}`,
            "Content-Length": "0",
          },
        });
      start = m[1] ? Number(m[1]) : Math.max(0, bytes - Number(m[2]));
      end = m[1] && m[2] ? Math.min(Number(m[2]), bytes - 1) : bytes - 1;
      if (start > end || start >= bytes)
        return new Response(null, {
          status: 416,
          headers: {
            ...headers,
            "Content-Range": `bytes */${bytes}`,
            "Content-Length": "0",
          },
        });
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${bytes}`;
      headers["Content-Length"] = String(end - start + 1);
    }
    return new Response(
      Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream,
      { status, headers },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

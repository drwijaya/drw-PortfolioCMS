import { CmsError } from "./repository";
export async function readBody(request: Request, max = 2 * 1024 * 1024) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new CmsError("Content-Type harus application/json", 415);
  if (!request.body) throw new CmsError("Body kosong");
  const reader = request.body.getReader();
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new CmsError("Payload terlalu besar", 413);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new CmsError("JSON tidak valid");
  }
}
export function json(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

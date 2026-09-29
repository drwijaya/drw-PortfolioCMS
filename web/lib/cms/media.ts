import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { media, mediaRefs, revisions } from "./db-schema";
import { mediaIds } from "./model";
import { CmsError, logAudit } from "./repository";
export function mediaRoot() {
  return process.env.CMS_MEDIA_DIR ?? path.join(process.cwd(), ".cms-media");
}
const TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/flac",
  "application/pdf",
]);
export async function uploadMedia(file: File, actor: string) {
  if (file.size > 100 * 1024 * 1024)
    throw new CmsError("Maksimum file 100 MB", 413);
  const data = Buffer.from(await file.arrayBuffer());
  const kind = await fileTypeFromBuffer(data);
  if (!kind || !TYPES.has(kind.mime))
    throw new CmsError("Jenis file tidak diizinkan");
  if (kind.mime.startsWith("image/") && file.size > 20 * 1024 * 1024)
    throw new CmsError("Maksimum gambar 20 MB", 413);
  const id = randomUUID(),
    folder = path.join(/* turbopackIgnore: true */ mediaRoot(), id);
  await mkdir(folder, { recursive: true });
  let width: number | undefined, height: number | undefined;
  const variants = ["original"];
  try {
    await writeFile(path.join(folder, "original"), data, { mode: 0o600 });
    if (kind.mime.startsWith("image/")) {
      const metadata = await sharp(data, {
        limitInputPixels: 40000000,
      }).metadata();
      width = metadata.width;
      height = metadata.height;
      if (!width || !height) throw new Error("Dimensi gambar tidak valid");
      for (const size of [320, 960, 1920]) {
        const name = `w${size}.webp`;
        await sharp(data, { limitInputPixels: 40000000 })
          .rotate()
          .resize({ width: size, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(path.join(folder, name));
        variants.push(name);
      }
    }
    await db()
      .insert(media)
      .values({
        id,
        name: path.basename(file.name).slice(0, 200),
        mime: kind.mime,
        bytes: data.length,
        width,
        height,
        variants,
      });
    await logAudit(actor, "media.upload", id, {
      bytes: data.length,
      mime: kind.mime,
    });
    return { id, url: `/media/${id}/original`, width, height, mime: kind.mime };
  } catch (error) {
    await rm(folder, { recursive: true, force: true });
    throw error;
  }
}
export async function mediaFile(id: string, variant: string) {
  if (!/^[a-f0-9-]{36}$/.test(id))
    throw new CmsError("Media tidak ditemukan", 404);
  const [asset] = await db().select().from(media).where(eq(media.id, id));
  if (!asset || !asset.variants.includes(variant) || asset.trashedAt)
    throw new CmsError("Media tidak ditemukan", 404);
  return {
    asset,
    file: path.join(/* turbopackIgnore: true */ mediaRoot(), id, variant),
    bytes: (
      await stat(
        path.join(/* turbopackIgnore: true */ mediaRoot(), id, variant),
      )
    ).size,
    mime: variant === "original" ? asset.mime : "image/webp",
  };
}
export async function mediaIsPublic(id: string) {
  const refs = await db()
    .select()
    .from(mediaRefs)
    .where(and(eq(mediaRefs.mediaId, id), eq(mediaRefs.visibility, "public")))
    .limit(1);
  return refs.length > 0;
}
export async function deleteMedia(
  id: string,
  actor: string,
  permanent = false,
) {
  const refs = await db()
    .select()
    .from(mediaRefs)
    .where(eq(mediaRefs.mediaId, id));
  const history = await db()
    .select({ document: revisions.document })
    .from(revisions);
  if (refs.length || history.some((r) => mediaIds(r.document).includes(id)))
    throw new CmsError("Media masih digunakan oleh konten atau draft");
  if (permanent) {
    const [asset] = await db().select().from(media).where(eq(media.id, id));
    if (!asset?.trashedAt)
      throw new CmsError("Pindahkan media ke trash terlebih dahulu");
    await db().delete(media).where(eq(media.id, id));
    await rm(path.join(/* turbopackIgnore: true */ mediaRoot(), id), {
      recursive: true,
      force: true,
    });
    await logAudit(actor, "media.delete", id);
    return;
  }
  await db()
    .update(media)
    .set({ trashedAt: new Date() })
    .where(eq(media.id, id));
  await logAudit(actor, "media.trash", id);
}
export async function storageStatus() {
  try {
    await stat(/* turbopackIgnore: true */ mediaRoot());
    return { available: true };
  } catch {
    return { available: false };
  }
}

export async function cropMedia(
  id: string,
  crop: { left: number; top: number; width: number; height: number },
  actor: string,
) {
  const source = await mediaFile(id, "original");
  if (!source.mime.startsWith("image/"))
    throw new CmsError("Crop hanya tersedia untuk gambar");
  const buffer = await sharp(
    await readFile(/* turbopackIgnore: true */ source.file),
    { limitInputPixels: 40000000 },
  )
    .rotate()
    .extract(crop)
    .png()
    .toBuffer();
  const result = await uploadMedia(
    new File([new Uint8Array(buffer)], `crop-${source.asset.name}.png`, {
      type: "image/png",
    }),
    actor,
  );
  await db()
    .update(media)
    .set({
      alt: source.asset.alt,
      caption: source.asset.caption,
      labels: source.asset.labels,
    })
    .where(eq(media.id, result.id));
  await logAudit(actor, "media.crop", id, { newMediaId: result.id });
  return result;
}

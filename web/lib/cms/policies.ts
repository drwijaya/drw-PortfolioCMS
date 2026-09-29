import { z } from "zod";
import { rooms, MEDIA_ROOMS } from "@/content/off-the-clock";
import { type CmsDocument, safeUrl } from "./model";
export { paletteIssues, paletteCss } from "./palette";
import { paletteIssues } from "./palette";
export const navigationSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            label: z.string().min(1).max(40),
            href: safeUrl,
            visible: z.boolean(),
            location: z.enum(["main", "footer"]),
          })
          .strict(),
      )
      .max(30),
  })
  .strict();
export const contactSettingsSchema = z
  .object({
    provider: z.enum(["smtp", "resend"]),
    host: z.string().max(253),
    port: z.number().int().min(1).max(65535),
    tls: z.boolean(),
    username: z.string().max(255),
    from: z.string(),
    to: z.string(),
    senderName: z.string().max(100),
    receipt: z.boolean(),
    rateLimit: z.number().int().min(1).max(20),
    windowMinutes: z.number().int().min(1).max(60),
    retentionDays: z.number().int().min(7).max(3650),
    ownerSubject: z.string().max(160),
    receiptSubject: z.string().max(160),
    copy: z.record(z.string().max(1000)).optional(),
    ownerTemplate: z.string().max(10000).optional(),
    receiptTemplate: z.string().max(10000).optional(),
  })
  .strict();
export const settingsSchema = z
  .object({
    siteTitle: z.string().max(200),
    description: z.string().max(500),
    favicon: z.string().startsWith("/"),
    ogImage: z.string().startsWith("/"),
    home: z.string().regex(/^\/(?!\/)[a-z0-9/-]*$/),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }),
    analyticsEnabled: z.boolean(),
    analyticsPublic: z.boolean(),
    contact: contactSettingsSchema,
  })
  .strict();
export async function validatePolicies(doc: CmsDocument,entryId?:string) {
  if(['pattern','page','post','work'].includes(doc.kind)){
    const {walkBlocks}=await import('./model');const {publishedEntries}=await import('./repository');const patterns=await publishedEntries('pattern')
    const find=(id:string)=>doc.kind==='pattern'&&(id===entryId||id===doc.slug)?doc:patterns.find(p=>p.id===id||p.published?.slug===id)?.published
    const visit=(d:CmsDocument,ancestors:Set<string>)=>{walkBlocks(d.blocks,n=>{if(n.type!=='pattern')return;const id=String(n.attributes.entryId);const pattern=find(id);if(!pattern)throw new Error(`Pattern ${id} belum diterbitkan`);if(ancestors.has(pattern.slug))throw new Error('Synced pattern membentuk siklus');visit(pattern,new Set([...ancestors,pattern.slug]))})};visit(doc,new Set(doc.kind==='pattern'?[doc.slug]:[]))
  }
  if (doc.kind === "appearance") {
    const issues = paletteIssues(doc.data);
    if (issues.length) throw new Error(issues.join("; "));
  }
  if (doc.kind === "navigation") {
    const data = navigationSchema.parse(doc.data);
    if (new Set(data.items.map((i) => i.id)).size !== data.items.length)
      throw new Error("ID menu duplikat");
    if (data.items.some((i) => /^\/(admin|api)(\/|$)/.test(i.href)))
      throw new Error("Menu publik tidak boleh menunjuk admin");
  }
  if (doc.kind === "settings") {
    settingsSchema.parse(doc.data);
    const { assertContactConfig } = await import("./mail");
    await assertContactConfig(
      doc.data.contact as z.infer<typeof contactSettingsSchema>,
    );
  }
  if (doc.kind === "collection") {
    if (!MEDIA_ROOMS.includes(doc.slug as (typeof MEDIA_ROOMS)[number]))
      throw new Error("Ruang terkunci");
    const room = rooms[doc.slug as (typeof MEDIA_ROOMS)[number]];
    const parsed = z
      .object({
        description: z.string().max(2000),
        favorites: z
          .array(
            z
              .object({
                id: z.string(),
                artwork: z.string().startsWith("/"),
                artworkAlt: z.string().max(500),
                artworkFit: z.enum(["contain", "cover"]),
                artworkPosition: z.string().regex(/^\d{1,3}% \d{1,3}%$/),
                note: z.string().max(5000),
              })
              .strict(),
          )
          .length(4),
      })
      .strict()
      .parse(doc.data);
    if (parsed.favorites.some((f, i) => f.id !== room.favorites[i].id))
      throw new Error("Identitas dan urutan slot game terkunci");
  }
  if (doc.kind === "playground" && doc.data.destinationType === "internal") {
    const { publishedEntries } = await import("./repository");
    const pages = await publishedEntries("page");
    const allowed = [
      "/playground/offtheclock",
      ...pages.map((p) => `/${p.published!.slug}`),
    ];
    if (!allowed.includes(String(doc.data.destination)))
      throw new Error("Tujuan internal belum terdaftar");
  }
}

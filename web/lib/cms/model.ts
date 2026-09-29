import { z } from "zod";
import {
  blockSchema,
  projectSchema,
  caseStudySchema,
  projectDetailSchema,
  designPortfolioDetailSchema,
  profileSchema,
  experienceSchema,
  educationSchema,
  certificationSchema,
  toolGroupSchema,
  playgroundSchema,
} from "@/lib/schema";
import type { Block, CaseStudySection, WorkDetail } from "@/lib/types";

export const KINDS = [
  "work",
  "post",
  "page",
  "playground",
  "profile",
  "navigation",
  "appearance",
  "settings",
  "collection",
  "pattern",
] as const;
export type EntryKind = (typeof KINDS)[number];
export interface CmsBlock {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  children: CmsBlock[];
  lock?:{move:boolean;remove:boolean};
}
export interface CmsDocument {
  schemaVersion: 1;
  kind: EntryKind;
  title: string;
  slug: string;
  data: Record<string, unknown>;
  blocks: CmsBlock[];
  seo: {
    title: string;
    description: string;
    image: string;
    noindex: boolean;
    canonical: string;
  };
}
export const LEGACY_BLOCKS = [
  "lead",
  "text",
  "figure",
  "gallery",
  "stats",
  "metrics",
  "quote",
  "list",
  "cards",
  "table",
  "pipeline",
  "compare",
  "personas",
  "callout",
  "tags",
] as const;
export const PAGE_BLOCKS = [
  "profile",
  "experience",
  "education",
  "certifications",
  "skills",
  "works",
  "playground",
  "blog",
  "contact",
] as const;
export const BLOCK_NAMES = [
  ...LEGACY_BLOCKS,
  "section",
  "beat",
  "heading",
  "button",
  "separator",
  "video",
  "audio",
  "file",
  "group",
  "columns",
  "pattern",
  ...PAGE_BLOCKS,
] as const;
export const LAYOUTS = [
  "context-stack",
  "narrative-split",
  "paired-evidence",
  "sequence-gallery",
  "data-ledger",
  "signal-band",
] as const;
const localUrl = z
  .string()
  .max(2048)
  .refine(
    (v) => !v || /^\/(?!\/)[^\s\\]*$/.test(v),
    "Gunakan URL lokal yang valid",
  );
export const safeUrl = z
  .string()
  .max(2048)
  .refine(
    (v) =>
      !v ||
      /^\/(?!\/)[^\s\\]*$/.test(v) ||
      (/^https?:\/\//i.test(v) && !/[\s\\]/.test(v)),
    "URL harus menggunakan http/https atau path lokal",
  );
export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/);
export const RESERVED = new Set([
  "admin",
  "api",
  "media",
  "works",
  "projects",
  "project",
  "playground",
  "about",
  "contact",
  "analytics",
  "analytics-api",
  "off-the-clock",
  "blog",
  "_next",
  "robots.txt",
  "sitemap.xml",
]);
const attributes = z.record(z.unknown());
const nodeSchema: z.ZodType<CmsBlock> = z
  .object({
    id: z.string().min(1).max(120),
    type: z.enum(BLOCK_NAMES),
    attributes,
    lock:z.object({move:z.boolean(),remove:z.boolean()}).strict().optional(),
    children: z.lazy(() => nodeSchema.array().max(200)),
  })
  .strict();
export const documentSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.enum(KINDS),
    title: z.string().trim().min(1).max(240),
    slug: slugSchema,
    data: attributes,
    blocks: nodeSchema.array().max(200),
    seo: z
      .object({
        title: z.string().max(240),
        description: z.string().max(500),
        image: localUrl,
        noindex: z.boolean(),
        canonical: localUrl,
      })
      .strict(),
  })
  .strict();
const beatSchema = z
  .object({
    layout: z.enum(LAYOUTS),
    intro: z.string(),
    heading: z.string().optional(),
    takeaway: z.string().optional(),
    tone: z.enum(["plain", "soft", "accent", "dark"]).optional(),
    mediaWidth: z.enum(["compact", "medium", "full"]).optional(),
    interaction: z.enum(["none", "comparison", "experiment"]).default("none"),
    walkthroughs: z.array(z.string()).optional(),
  })
  .strict();
export const defaultSeo = () => ({
  title: "",
  description: "",
  image: "",
  noindex: false,
  canonical: "",
});
export function walkBlocks(
  blocks: CmsBlock[],
  visit: (block: CmsBlock) => void,
) {
  for (const block of blocks) {
    visit(block);
    walkBlocks(block.children, visit);
  }
}
export function validateDocument(
  input: unknown,
  publishing = false,
): CmsDocument {
  const doc = documentSchema.parse(input);
  if (
    doc.kind === "page" &&
    !["works", "about", "contact", "playground"].includes(doc.slug) &&
    RESERVED.has(doc.slug.split("/")[0])
  )
    throw new Error("Slug halaman dicadangkan untuk sistem");
  if (doc.kind !== "page" && doc.slug.includes("/"))
    throw new Error("Slug tidak boleh memiliki subpath");
  const ids = new Set<string>();
  let count = 0;
  const check = (nodes: CmsBlock[], depth = 0) => {
    if (depth > 8) throw new Error("Blok terlalu dalam");
    for (const n of nodes) {
      if (ids.has(n.id)) throw new Error("ID blok duplikat");
      ids.add(n.id);
      if (++count > 1000) throw new Error("Dokumen melebihi 1000 blok");
      if ((LEGACY_BLOCKS as readonly string[]).includes(n.type)) {
        if (publishing) blockSchema.parse({ type: n.type, ...n.attributes });
        if (n.children.length)
          throw new Error("Blok konten tidak memiliki child blocks");
      }
      if (n.type === "section") {
        z.object({
          anchor: z.string().regex(/^[a-z0-9-]+$/),
          label: z.string(),
          lead: z.string(),
        }).parse(n.attributes);
        if (n.children.some((c) => c.type !== "beat"))
          throw new Error("Section hanya berisi layout");
      }
      if (n.type === "beat") {
        beatSchema.parse(n.attributes);
        if (n.attributes.interaction === "experiment" && publishing) {
          const t = n.children.find((b) => b.type === "table");
          const rows = t?.attributes.rows as string[][] | undefined;
          if (!rows?.length || rows.some((row) => row.length < 5))
            throw new Error("Experiment membutuhkan tabel minimal 5 kolom");
        }
      }
      if (["video", "audio", "file"].includes(n.type))
        localUrl.parse(n.attributes.src);
      if (n.type === "button") safeUrl.parse(n.attributes.href);
      if (n.type === "heading")
        z.object({
          text: z.string(),
          level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
        }).parse(n.attributes);
      if (n.type === "pattern")
        z.object({ entryId: z.string().min(1).max(160) }).strict().parse(n.attributes);
      check(n.children, depth + 1);
    }
  };
  check(doc.blocks);
  if (publishing) {
    if (doc.kind === "work") {
      projectSchema.parse(doc.data.project);
      const detail = workDetail(doc);
      if (detail.presentationType === "case-study")
        caseStudySchema.parse(detail);
      else if (detail.presentationType === "project")
        projectDetailSchema.parse(detail);
      else designPortfolioDetailSchema.parse(detail);
    }
    if (doc.kind === "profile") {
      profileSchema.parse(doc.data.profile);
      z.array(experienceSchema).parse(doc.data.experience);
      z.array(educationSchema).parse(doc.data.education);
      z.array(certificationSchema).parse(doc.data.certifications);
      z.array(z.string()).parse(doc.data.skills);
      z.array(toolGroupSchema).parse(doc.data.toolGroups);
    }
    if (doc.kind === "playground")
      playgroundSchema.parse({ ...doc.data, slug: doc.slug, title: doc.title });
  }
  return doc;
}
export function workDetail(doc: CmsDocument): WorkDetail {
  const base = doc.data.detail as WorkDetail;
  const sections = doc.blocks
    .filter((n) => n.type === "section"&&n.attributes.hidden!==true)
    .map((n) => ({
      id: String(n.attributes.anchor),
      label: String(n.attributes.label),
      lead: String(n.attributes.lead),
      blocks: n.children.filter(b=>b.attributes.hidden!==true).flatMap((b) => b.children.filter(c=>c.attributes.hidden!==true).map(toLegacyBlock)),
      cmsBeats: n.children.filter(b=>b.attributes.hidden!==true).map((b) => ({
        id: b.id,
        ...b.attributes,
        blocks: b.children.filter(c=>c.attributes.hidden!==true).map(toLegacyBlock),
      })),
    }));
  return {
    ...base,
    slug: doc.slug,
    title: doc.title,
    sections: sections as CaseStudySection[],
  };
}
export function toLegacyBlock(node: CmsBlock): Block {
  return { type: node.type, ...node.attributes } as Block;
}
export function mediaIds(doc: CmsDocument): string[] {
  const text = JSON.stringify(doc);
  return [
    ...new Set(
      [...text.matchAll(/\/media\/([a-f0-9-]{36})/g)].map((m) => m[1]),
    ),
  ];
}
export function publicPath(doc: CmsDocument) {
  switch (doc.kind) {
    case "work":
      return `/works/${doc.slug}`;
    case "post":
      return `/blog/${doc.slug}`;
    case "page":
      return `/${doc.slug}`;
    case "playground":
      return "/playground";
    default:
      return null;
  }
}
export function defaultDocument(kind: EntryKind): CmsDocument {
  return {
    schemaVersion: 1,
    kind,
    title: "Tanpa judul",
    slug: `baru-${Date.now()}`,
    data:
      kind === "post"
        ? {
            excerpt: "",
            categories: [],
            tags: [],
            cover: "",
            author: "",
            date: new Date().toISOString(),
          }
        : kind === "page"
          ? { template: "standard", visible: true }
          : {},
    blocks: [],
    seo: defaultSeo(),
  };
}
export function emptyBlock(type: string): CmsBlock {
  const defaults: Record<string, Record<string, unknown>> = {
    profile:{profileMode:"identity"},
    text: { html: "" },
    lead: { html: "" },
    heading: { text: "Heading", level: 2 },
    figure: { src: "", alt: "", caption: "" },
    gallery: { entries: [{ src: "", label: "", alt: "" }] },
    quote: { text: "", cite: "" },
    list: { variant: "plain", entries: [{ title: "", body: "" }] },
    stats: { entries: [{ value: "0", label: "", note: "" }] },
    metrics: { entries: [{ count: 0, label: "", suffix: "" }] },
    cards: { cols: 2, entries: [{ title: "", body: "" }] },
    table: { head: ["Column"], rows: [["Value"]] },
    pipeline: { entries: [{ n: "1", label: "", sub: "" }] },
    compare: { entries: [["Before", "After"]] },
    personas: {
      entries: [
        { name: "", age: "", role: "", exp: "", summary: "", goals: [""] },
      ],
    },
    callout: { title: "", body: "" },
    tags: { entries: [""] },
    section: { anchor: `section-${Date.now()}`, label: "Section", lead: "" },
    beat: { layout: "context-stack", intro: "", interaction: "none" },
    button: { text: "Read more", href: "/" },
    video: { src: "", caption: "" },
    audio: { src: "", caption: "" },
    file: { src: "", label: "Download" },
    columns: { cols: 2 },
    pattern: { entryId: "" },
  };
  return {
    id: crypto.randomUUID(),
    type,
    attributes: structuredClone(defaults[type] ?? {}),
    children: [],
  };
}

import { contactCopy } from "./contact-copy";
import { createHash } from "node:crypto";
import { projects } from "@/content/projects";
import { caseStudies } from "@/content/case-studies";
import { projectDetails } from "@/content/project-details";
import { designPortfolios } from "@/content/design-portfolios";
import { profile } from "@/content/profile";
import { experience } from "@/content/experience";
import { education } from "@/content/education";
import { certifications } from "@/content/certifications";
import { skills, toolGroups } from "@/content/skills";
import { playground } from "@/content/playground";
import { rooms, MEDIA_ROOMS } from "@/content/off-the-clock";
import { walkthroughs } from "@/content/case-studies/walkthroughs";
import { resolveSectionBeats } from "@/lib/case-study/layouts";
import { originalPalette } from "./palette-defaults";
import { type CmsDocument, type CmsBlock, defaultSeo } from "./model";
export const seedId = (value: string) =>
  createHash("sha256").update(value).digest("hex").slice(0, 24);
const base = (
  kind: CmsDocument["kind"],
  slug: string,
  title: string,
  data: Record<string, unknown>,
  blocks: CmsBlock[] = [],
): CmsDocument => ({
  schemaVersion: 1,
  kind,
  slug,
  title,
  data,
  blocks,
  seo: defaultSeo(),
});
export function seedDocuments(): CmsDocument[] {
  const details = { ...caseStudies, ...projectDetails, ...designPortfolios };
  const works = projects.map((project) => {
    const detail = details[project.detailSlug];
    const blocks: CmsBlock[] = detail.sections.map((section) => ({
      id: seedId(`${project.slug}/${section.id}`),
      type: "section",
      attributes: {
        anchor: section.id,
        label: section.label,
        lead: section.lead,
      },
      children: resolveSectionBeats(project.slug, section).map((beat) => ({
        id: beat.id,
        type: "beat",
        attributes: {
          layout: beat.layout,
          intro: beat.intro,
          ...(beat.heading ? { heading: beat.heading } : {}),
          ...(beat.takeaway ? { takeaway: beat.takeaway } : {}),
          ...(beat.tone ? { tone: beat.tone } : {}),
          ...(beat.mediaWidth ? { mediaWidth: beat.mediaWidth } : {}),
          interaction:
            beat.id === "signal-comparison"
              ? "comparison"
              : beat.id === "twelve-runs"
                ? "experiment"
                : "none",
          ...(walkthroughs[beat.id]
            ? { walkthroughs: walkthroughs[beat.id] }
            : {}),
        },
        children: beat.blocks.map((block, i) => {
          const { type, ...attributes } = block;
          return {
            id: seedId(`${project.slug}/${beat.id}/${i}`),
            type,
            attributes,
            children: [],
          };
        }),
      })),
    }));
    return base(
      "work",
      project.slug,
      detail.title,
      { project, detail: { ...detail, sections: [] } },
      blocks,
    );
  });
  const pages = [
    ["works", "Selected work", "works"],
    ["about", "About", "profile"],
    ["contact", "Contact", "contact"],
    ["playground", "Playground", "playground"],
  ].map(([slug, title, type]) =>
    base("page", slug, title, { template: "existing", visible: true }, [
      { id: seedId(`page/${slug}`), type, attributes: {}, children: [] },
    ]),
  );
  return [
    ...works,
    ...pages,
    ...playground.map((p) =>
      base(
        "playground",
        p.slug,
        p.title,
        p as unknown as Record<string, unknown>,
      ),
    ),
    base("profile", "owner", "Profil", {
      profile:{...profile,sidebarPhoto:'/sidebar-portrait.png',sidebarMark:'/logo-wordmark.png',footerText:`View Analytics · ©${new Date(profile.updatedAt).getFullYear()}`,socialLinks:[{href:profile.linkedinUrl,label:'LinkedIn'},{href:profile.githubUrl,label:'GitHub'},{href:profile.instagramUrl,label:'Instagram'},{href:`mailto:${profile.email}`,label:'Email'}]},
      experience,
      education,
      certifications,
      skills,
      toolGroups,
    }),
    base("navigation", "main", "Navigasi", {
      items: ["works", "playground", "about", "contact"].map((id) => ({
        id,
        label: id[0].toUpperCase() + id.slice(1),
        href: `/${id}`,
        visible: true,
        location: "main",
      })),
    }),
    base(
      "appearance",
      "active",
      "Warna website",
      structuredClone(originalPalette),
    ),
    base("settings", "site", "Pengaturan website", {
      siteTitle: `${profile.fullName} · ${profile.roleTitle}`,
      description: profile.shortBio,
      favicon: "/img/favicon-mark.png",
      ogImage: profile.photo,
      home: "/works",
      timezone: "UTC",
      analyticsEnabled: true,
      analyticsPublic: true,
      contact: {
        copy: contactCopy,
        ownerTemplate: "",
        receiptTemplate: "",
        provider: "smtp",
        host: "",
        port: 587,
        tls: true,
        username: "",
        from: "",
        to: "",
        senderName: "drw · Contact form",
        receipt: true,
        rateLimit: 3,
        windowMinutes: 10,
        retentionDays: 365,
        ownerSubject: "New contact message",
        receiptSubject: "Thanks for getting in touch",
      },
    }),
    ...MEDIA_ROOMS.map((room) =>
      base("collection", room, `Off the Clock · ${room}`, {
        description: rooms[room].description,
        favorites: rooms[room].favorites.map((f) => ({
          id: f.id,
          artwork: f.artwork ?? "",
          artworkAlt: f.artworkAlt ?? f.title,
          artworkFit: f.artworkFit ?? "contain",
          artworkPosition: f.artworkPosition ?? "50% 50%",
          note: f.note,
        })),
      }),
    ),
  ];
}

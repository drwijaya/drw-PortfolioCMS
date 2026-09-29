// ─────────────────────────────────────────────────────────────────────────
// Runtime validation, mirroring lib/types.ts.
// Parsed once in lib/content.ts, so bad content fails the build.
// ─────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

const tone = z.enum(['good', 'bad'])

// ── blocks ───────────────────────────────────────────────────────────────

const leadBlock = z.object({ type: z.literal('lead'), html: z.string() })
const textBlock = z.object({ type: z.literal('text'), html: z.string() })

const figureBlock = z.object({
  type: z.literal('figure'),
  src: z.string().startsWith('/'),
  alt: z.string(),
  caption: z.string().optional(),
  plate: z.boolean().optional(),
  wide: z.boolean().optional(),
})

const galleryBlock = z.object({
  type: z.literal('gallery'),
  entries: z
    .object({
      src: z.string().startsWith('/'),
      label: z.string(),
      alt: z.string(),
      span: z.literal('three').optional(),
    })
    .array()
    .min(1),
})

const statsBlock = z.object({
  type: z.literal('stats'),
  entries: z
    .object({
      value: z.string(),
      label: z.string(),
      note: z.string().optional(),
      tone: tone.optional(),
    })
    .array()
    .min(1),
})

const metricsBlock = z.object({
  type: z.literal('metrics'),
  entries: z
    .object({
      count: z.number(),
      label: z.string(),
      suffix: z.string().optional(),
      prefix: z.string().optional(),
      decimals: z.number().int().min(0).max(4).optional(),
      sub: z.string().optional(),
      tone: tone.optional(),
    })
    .array()
    .min(1),
})

const quoteBlock = z.object({
  type: z.literal('quote'),
  text: z.string(),
  cite: z.string().optional(),
})

const listBlock = z.object({
  type: z.literal('list'),
  variant: z.enum(['numbered', 'plain']).optional(),
  entries: z
    .object({ title: z.string(), body: z.string().optional() })
    .array()
    .min(1),
})

const cardsBlock = z.object({
  type: z.literal('cards'),
  cols: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  entries: z
    .object({
      num: z.string().optional(),
      title: z.string(),
      body: z.string(),
    })
    .array()
    .min(1),
})

const tableBlock = z.object({
  type: z.literal('table'),
  head: z.string().array().min(1),
  rows: z.string().array().array().min(1),
  foot: z.string().array().optional(),
  note: z.string().optional(),
  compact: z.boolean().optional(),
})

const pipelineBlock = z.object({
  type: z.literal('pipeline'),
  entries: z
    .object({
      n: z.string(),
      label: z.string(),
      sub: z.string().optional(),
      final: z.boolean().optional(),
    })
    .array()
    .min(1),
})

const compareBlock = z.object({
  type: z.literal('compare'),
  entries: z.tuple([z.string(), z.string()]).array().min(1),
})

const personasBlock = z.object({
  type: z.literal('personas'),
  entries: z
    .object({
      name: z.string(),
      age: z.string(),
      role: z.string(),
      exp: z.string(),
      summary: z.string(),
      goals: z.string().array(),
      pains: z.string().array().optional(),
      hmw: z.string().optional(),
    })
    .array()
    .min(1),
})

const calloutBlock = z.object({
  type: z.literal('callout'),
  title: z.string(),
  body: z.string(),
})

const tagsBlock = z.object({
  type: z.literal('tags'),
  entries: z.string().array().min(1),
})

export const blockSchema = z.discriminatedUnion('type', [
  leadBlock, textBlock, figureBlock, galleryBlock, statsBlock,
  metricsBlock, quoteBlock, listBlock, cardsBlock, tableBlock,
  pipelineBlock, compareBlock, personasBlock, calloutBlock, tagsBlock,
])

// ── case study ───────────────────────────────────────────────────────────

const words = (s: string) => s.trim().split(/\s+/).length

export const caseStudySectionSchema = z.object({
  id: z.string().min(1),
  // Guards, not preferences. Drift here is what produced four competing
  // names per section last time, and a review pass will not catch it again.
  label: z
    .string()
    .min(1)
    .refine((s) => words(s) <= 2, 'label must be one or two words'),
  lead: z
    .string()
    .min(1)
    .refine((s) => words(s) <= 25, 'lead must be 25 words or fewer'),
  blocks: blockSchema.array().min(1),
})

const workDetailBaseSchema = z.object({
  slug: z.string().min(1),
  eyebrow: z.string(),
  title: z.string().min(1),
  subtitle: z.string(),
  client: z.string().optional(),
  hero: z.object({
    src: z.string().startsWith('/'),
    alt: z.string().min(1),
    caption: z.string().optional(),
    plate: z.boolean().optional(),
  }),
  meta: z
    .object({ label: z.string(), value: z.string() })
    .array()
    .length(4)
    .refine(
      (entries) =>
        entries.map((entry) => entry.label).join('|') ===
        'Role|Team|Timeline|Project type',
      'meta must use Role / Team / Timeline / Project type in that order'
    ),
  stack: z.string().array(),
  sections: caseStudySectionSchema.array().min(1),
})

export const caseStudySchema = workDetailBaseSchema.extend({
  presentationType: z.literal('case-study'),
  overview: z.object({
    summary: z.string().min(1),
    role: z.string().min(1),
    objectives: z.string().array().min(2).max(4),
  }),
  snapshot: z.object({
    challenge: z.string().min(1),
    delivered: z.string().min(1),
    outcome: z.string().min(1),
  }),
  engineeringLens: z.object({
    system: z.string().min(1),
    objective: z.string().min(1),
    stakeholders: z.string().min(1),
    constraints: z.string().array().min(1),
    methods: z.string().array().min(1),
  }),
  evidence: z.object({
    level: z.enum(['E0', 'E1', 'E2', 'E3']),
    name: z.string().min(1),
    summary: z.string().min(1),
    sourceNote: z.string().min(1),
    limit: z.string().min(1),
  }),
})

export const projectDetailSchema = workDetailBaseSchema.extend({
  presentationType: z.literal('project'),
})

export const designPortfolioDetailSchema = workDetailBaseSchema.extend({
  presentationType: z.literal('design-portfolio'),
})

// ── projects & profile ───────────────────────────────────────────────────

export const projectSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: z.string().min(1),
  presentationType: z.enum(['case-study', 'project', 'design-portfolio']),
  practice: z.enum([
    'Operations & Quality',
    'Systems Analysis',
    'Digital Product',
    'Visual Systems',
  ]),
  sector: z.enum(['Manufacturing', 'Education', 'Professional Organization']),
  projectType: z.enum([
    'Capstone',
    'Academic',
    'Laboratory',
    'Organization',
    'Internship',
    'Self-initiated',
  ]),
  cardStatement: z.string().refine((value) => {
    const words = value.trim().split(/\s+/).length
    return words >= 18 && words <= 26
  }, 'cardStatement must contain 18 to 26 words'),
  categoryColor: z.enum(['sage', 'dusty-blue', 'mustard', 'terracotta']),
  year: z.string().regex(/^\d{4}$/),
  status: z.enum(['published', 'in_progress', 'coming_soon']),
  methods: z.string().array().min(1),
  deliverables: z.string().array().min(1),
  tools: z.string().array(),
  thumb: z.string().startsWith('/'),
  hero: z.string().startsWith('/').optional(),
  tileRatio: z.string().regex(/^\d+\/\d+$/),
  portfolioRank: z.number().int().positive(),
  proofLevel: z.enum(['E0', 'E1', 'E2', 'E3']).optional(),
  projectUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
  detailSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'detailSlug must be kebab-case'),
}).superRefine((project, context) => {
  if (project.presentationType === 'case-study' && !project.proofLevel) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['proofLevel'],
      message: 'Case Study cards require a proofLevel',
    })
  }
})

export const profileSchema = z.object({
  sidebarPhoto:z.string().startsWith('/').optional(),
  sidebarMark:z.string().startsWith('/').optional(),
  footerText:z.string().max(100).optional(),
  socialLinks:z.array(z.object({label:z.string().min(1).max(40),href:z.string().refine(v=>/^https?:\/\//.test(v)||/^mailto:[^\s]+@[^\s]+$/.test(v),'Invalid social URL')})).max(12).optional(),
  fullName: z.string().min(1),
  displayName: z.string().min(1),
  roleTitle: z.string(),
  shortBio: z.string().max(260, 'shortBio must fit the sidebar column'),
  bio: z.string(),
  statusLabel: z.string(),
  photo: z.string().startsWith('/'),
  email: z.string().email(),
  linkedinUrl: z.string().url(),
  githubUrl: z.string().url(),
  instagramUrl: z.string().url(),
  cvUrl: z.string().refine(v=>/^\/(?!\/)[^\s\\]*$/.test(v)||/^https?:\/\//.test(v),'Invalid CV URL'),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const experienceSchema = z.object({
  role: z.string().min(1),
  company: z.string().min(1),
  dateRange: z.string(),
  description: z.string(),
  tags: z.string().array(),
  order: z.number().int(),
})

export const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  dateRange: z.string(),
  grade: z.string().optional(),
  details: z.string().optional(),
  order: z.number().int(),
})

export const certificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  issued: z.string(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional(),
  skills: z.string().array(),
  order: z.number().int(),
})

export const toolGroupSchema = z.object({
  label: z.string().min(1),
  tools: z
    .object({
      name: z.string().min(1),
      icon: z.string().optional(),
      /**
       * Interpolated into a CSS url(), so the shape is pinned here rather
       * than trusted at the call site: no spaces, no quotes, no closing
       * paren, and an extension the mask can actually rasterise.
       */
      logo: z
        .string()
        .regex(
          /^\/[\w./-]+\.(svg|png|webp)$/,
          'logo must be an absolute /path to an .svg, .png or .webp'
        )
        .optional(),
    })
    .array()
    .min(1),
  order: z.number().int(),
})

/** Practice names. Flat, but validated like everything else in here. */
export const skillsSchema = z.string().min(1).array()

export const playgroundSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: z.string().min(1),
  premise: z.string().min(1),
  medium: z.string().min(1),
  status: z.enum(['experiment', 'prototype', 'in_progress', 'archived']),
  preview: z.string().startsWith('/'),
  previewWidth: z.number().int().positive(),
  previewHeight: z.number().int().positive(),
  learning: z.string().min(1),
  destination: z.union([z.string().startsWith('/'), z.string().url()]),
  destinationType: z.enum(['internal', 'external']),
  playgroundRank: z.number().int().positive(),
  listedAt: z.string().date(),
})

// ── contact form ─────────────────────────────────────────────────────────

export const contactSchema = z.object({
  name: z.string().min(1, 'Tell me your name').max(120),
  email: z.string().email('That email address looks wrong'),
  body: z.string().min(10, 'A little more detail, please').max(4000),
  /** Honeypot: humans leave it empty; bounded bot input is handled silently. */
  website: z.string().max(200).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>

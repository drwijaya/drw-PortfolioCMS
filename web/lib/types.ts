// ─────────────────────────────────────────────────────────────────────────
// The shape of every piece of content on the site.
//
// These types are also the future database schema. When the admin panel
// arrives, the source behind lib/content.ts changes and these do not.
// ─────────────────────────────────────────────────────────────────────────

export type Tone = 'good' | 'bad'

// ── case-study blocks ────────────────────────────────────────────────────
// Field names are ported verbatim from app/case_studies.py. Do not rename
// them without re-running the port script.

export interface LeadBlock { type: 'lead'; html: string }
export interface TextBlock { type: 'text'; html: string }

export interface FigureBlock {
  type: 'figure'
  src: string
  alt: string
  caption?: string
  /** render on a raised surface plate */
  plate?: boolean
  /** break out of the text measure */
  wide?: boolean
}

export interface GalleryBlock {
  type: 'gallery'
  entries: { src: string; label: string; alt: string; span?: "three" }[]
}

export interface StatsBlock {
  type: 'stats'
  entries: { value: string; label: string; note?: string; tone?: Tone }[]
}

export interface MetricsBlock {
  type: 'metrics'
  entries: {
    count: number
    label: string
    suffix?: string
    prefix?: string
    decimals?: number
    sub?: string
    tone?: Tone
  }[]
}

export interface QuoteBlock { type: 'quote'; text: string; cite?: string }

export interface ListBlock {
  type: 'list'
  variant?: 'numbered' | 'plain'
  entries: { title: string; body?: string }[]
}

export interface CardsBlock {
  type: 'cards'
  cols: 2 | 3 | 4
  entries: { num?: string; title: string; body: string }[]
}

export interface TableBlock {
  type: 'table'
  head: string[]
  rows: string[][]
  foot?: string[]
  note?: string
  /** tighter cell padding, for dense reference tables */
  compact?: boolean
}

export interface PipelineBlock {
  type: 'pipeline'
  entries: { n: string; label: string; sub?: string; final?: boolean }[]
}

export interface CompareBlock {
  type: 'compare'
  /** [before, after] */
  entries: [string, string][]
}

export interface PersonasBlock {
  type: 'personas'
  entries: {
    name: string
    age: string
    role: string
    exp: string
    summary: string
    goals: string[]
    pains?: string[]
    hmw?: string
  }[]
}

export interface CalloutBlock {
  type: 'callout'
  title: string
  body: string
}

export interface TagsBlock { type: 'tags'; entries: string[] }

export type Block =
  | LeadBlock | TextBlock | FigureBlock | GalleryBlock | StatsBlock
  | MetricsBlock | QuoteBlock | ListBlock | CardsBlock | TableBlock
  | PipelineBlock | CompareBlock | PersonasBlock | CalloutBlock | TagsBlock

export type BlockType = Block['type']

// ── case study ───────────────────────────────────────────────────────────

export interface CaseStudySection {
  cmsBeats?: {id:string;layout:'context-stack'|'narrative-split'|'paired-evidence'|'sequence-gallery'|'data-ledger'|'signal-band';intro:string;heading?:string;takeaway?:string;tone?:'plain'|'soft'|'accent'|'dark';mediaWidth?:'compact'|'medium'|'full';interaction?:'none'|'comparison'|'experiment';walkthroughs?:string[];blocks:Block[]}[]

  /** anchor id, unique within the study */
  id: string
  /**
   * The nav name. One or two plain words, e.g. "problem", "method".
   * Not a sentence and not an argument: the rail says what the section is
   * about, and the lead below says what it claims.
   */
  label: string
  /**
   * One sentence, 25 words at most. Either the section's claim (narrative
   * sections) or its purpose (method and procedure sections, per the
   * "To do X, I did Y" pattern). Also shown in the sticky rail card.
   *
   * This replaced `kicker`, `headline` and `summary`, which between them
   * gave every section four competing names for itself.
   */
  lead: string
  blocks: Block[]
}

export interface CaseStudySnapshot {
  challenge: string
  delivered: string
  outcome: string
}

export interface CaseStudyOverview {
  summary: string
  role: string
  objectives: string[]
}

export type ProofLevel = 'E0' | 'E1' | 'E2' | 'E3'

export interface EngineeringLens {
  system: string
  objective: string
  stakeholders: string
  constraints: string[]
  methods: string[]
}

export interface EvidenceRecord {
  level: ProofLevel
  name: string
  summary: string
  sourceNote: string
  limit: string
}

export interface WorkDetailBase {
  slug: string
  presentationType: Exclude<WorkPresentationType, 'playground'>
  eyebrow: string
  title: string
  subtitle: string
  client?: string
  hero: {
    src: string
    alt: string
    caption?: string
    plate?: boolean
  }
  meta: { label: string; value: string }[]
  stack: string[]
  sections: CaseStudySection[]
}

export interface CaseStudy extends WorkDetailBase {
  presentationType: 'case-study'
  overview: CaseStudyOverview
  snapshot: CaseStudySnapshot
  engineeringLens: EngineeringLens
  evidence: EvidenceRecord
}

export interface ProjectDetail extends WorkDetailBase {
  presentationType: 'project'
}

export interface DesignPortfolioDetail extends WorkDetailBase {
  presentationType: 'design-portfolio'
}

export type WorkDetail = CaseStudy | ProjectDetail | DesignPortfolioDetail

// ── projects ─────────────────────────────────────────────────────────────

export type ProjectStatus = 'published' | 'in_progress' | 'coming_soon'
export type CategoryColor = 'sage' | 'dusty-blue' | 'mustard' | 'terracotta'
export type WorkPresentationType =
  | 'case-study'
  | 'project'
  | 'design-portfolio'
  | 'playground'
export type WorkPractice =
  | 'Operations & Quality'
  | 'Systems Analysis'
  | 'Digital Product'
  | 'Visual Systems'
export type WorkSector =
  | 'Manufacturing'
  | 'Education'
  | 'Professional Organization'
export type WorkProjectType =
  | 'Capstone'
  | 'Academic'
  | 'Laboratory'
  | 'Organization'
  | 'Internship'
  | 'Self-initiated'

export interface Project {
  slug: string
  title: string
  presentationType: Exclude<WorkPresentationType, 'playground'>
  practice: WorkPractice
  sector: WorkSector
  projectType: WorkProjectType
  cardStatement: string
  categoryColor: CategoryColor
  year: string
  status: ProjectStatus
  methods: string[]
  deliverables: string[]
  tools: string[]
  /** spec-sheet hover thumbnail and landing tile */
  thumb: string
  hero?: string
  /** landing grid rhythm: '7/5' | '4/5' | '16/7' */
  tileRatio: string
  portfolioRank: number
  proofLevel?: ProofLevel
  projectUrl?: string
  githubUrl?: string
  demoUrl?: string
  detailSlug: string
}

// ── profile & misc ───────────────────────────────────────────────────────

export interface Profile {
  sidebarPhoto?:string
  sidebarMark?:string
  footerText?:string
  socialLinks?:{label:string;href:string}[]
  fullName: string
  displayName: string
  roleTitle: string
  /** ≤160 chars; the sidebar column is narrow */
  shortBio: string
  bio: string
  statusLabel: string
  photo: string
  email: string
  linkedinUrl: string
  githubUrl: string
  instagramUrl: string
  cvUrl: string
  /** ISO date, rendered as the sidebar stamp */
  updatedAt: string
}

export interface Experience {
  role: string
  company: string
  dateRange: string
  description: string
  tags: string[]
  order: number
}

export interface Education {
  institution: string
  degree: string
  dateRange: string
  grade?: string
  details?: string
  order: number
}

export interface Certification {
  name: string
  issuer: string
  issued: string
  credentialId?: string
  credentialUrl?: string
  skills: string[]
  order: number
}

/**
 * The tool marks the glyph registry carries.
 *
 * Declared here rather than inferred from components/icons/tools.tsx, so the
 * content types never reach into the view layer. The registry is typed as
 * `Record<ToolIcon, Glyph>`, which makes the check run both ways: a key here
 * with no glyph fails the build, and so does a glyph with no key.
 */
export type ToolIcon =
  | 'html5'
  | 'css'
  | 'javascript'
  | 'git'
  | 'github'
  | 'nodejs'
  | 'flask'
  | 'python'
  | 'sap'
  | 'claude'
  | 'figma'
  | 'drawio'
  | 'vscode'
  | 'photoshop'
  | 'premierepro'
  | 'spss'
  | 'minitab'

export interface Tool {
  name: string
  /** key into components/icons/tools.tsx; absent when no open mark exists */
  icon?: ToolIcon
  /**
   * A supplied mark under /public, for tools no open icon set carries.
   * Drawn as a mask rather than an image, so it takes `currentColor` like
   * the inline glyphs and needs no dark-mode variant of its own. That also
   * makes the source file's own colour irrelevant: codex.png is near-white
   * and would be invisible on the wash if it were painted as-is.
   */
  logo?: string
}

export interface ToolGroup {
  label: string
  tools: Tool[]
  order: number
}

export interface PlaygroundItem {
  slug: string
  title: string
  premise: string
  medium: string
  status: 'experiment' | 'prototype' | 'in_progress' | 'archived'
  preview: string
  previewWidth: number
  previewHeight: number
  learning: string
  destination: string
  destinationType: 'internal' | 'external'
  playgroundRank: number
  /** Date this item was added to the Playground index, for the recent rail. */
  listedAt: string
}

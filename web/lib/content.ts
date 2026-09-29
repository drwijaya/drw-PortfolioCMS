import { cmsEnabled } from './cms/db'
import { readDocuments, readDocument, profileData } from './cms/read'
import { workDetail } from './cms/model'
// ─────────────────────────────────────────────────────────────────────────
// THE DATA-ACCESS BOUNDARY
//
// This is the only module that knows where content physically lives.
// No component may import from content/ directly.
//
// Every function is async even though nothing awaits today. That is
// deliberate: when the source becomes a database or a CMS, these signatures
// do not change and no component is touched.
// ─────────────────────────────────────────────────────────────────────────

import { caseStudies } from '@/content/case-studies'
import { certifications } from '@/content/certifications'
import { designPortfolios } from '@/content/design-portfolios'
import { education } from '@/content/education'
import { experience } from '@/content/experience'
import { playground } from '@/content/playground'
import { profile } from '@/content/profile'
import { projectDetails } from '@/content/project-details'
import { skills, toolGroups } from '@/content/skills'
import { projects } from '@/content/projects'
import {
  caseStudySchema,
  certificationSchema,
  designPortfolioDetailSchema,
  educationSchema,
  experienceSchema,
  playgroundSchema,
  profileSchema,
  projectDetailSchema,
  projectSchema,
  skillsSchema,
  toolGroupSchema,
} from '@/lib/schema'
import type {
  CaseStudy,
  Certification,
  DesignPortfolioDetail,
  Education,
  Experience,
  PlaygroundItem,
  Profile,
  Project,
  ProjectDetail,
  ToolGroup,
  WorkDetail,
} from '@/lib/types'

// ── validate once, at module load (build time for static pages) ──────────
// A malformed block fails the build instead of rendering blank in production.

const VALIDATED_PROJECTS: Project[] = projects.map((p, i) => {
  const r = projectSchema.safeParse(p)
  if (!r.success) {
    throw new Error(
      `content/projects.ts[${i}] (${p.slug ?? 'no slug'}) is invalid:\n` +
        JSON.stringify(r.error.format(), null, 2)
    )
  }
  return r.data
})

const VALIDATED_PROFILE: Profile = (() => {
  const r = profileSchema.safeParse(profile)
  if (!r.success) {
    throw new Error(
      'content/profile.ts is invalid:\n' +
        JSON.stringify(r.error.format(), null, 2)
    )
  }
  return r.data
})()

const VALIDATED_CASE_STUDIES: Record<string, CaseStudy> = Object.fromEntries(
  Object.entries(caseStudies).map(([slug, cs]) => {
    const r = caseStudySchema.safeParse(cs)
    if (!r.success) {
      throw new Error(
        `content/case-studies/${slug}.ts is invalid:\n` +
          JSON.stringify(r.error.format(), null, 2)
      )
    }
    return [slug, r.data]
  })
)

const VALIDATED_PROJECT_DETAILS: Record<string, ProjectDetail> =
  Object.fromEntries(
    Object.entries(projectDetails).map(([slug, detail]) => {
      const r = projectDetailSchema.safeParse(detail)
      if (!r.success) {
        throw new Error(
          `content/project-details/${slug}.ts is invalid:\n` +
            JSON.stringify(r.error.format(), null, 2)
        )
      }
      return [slug, r.data]
    })
  )

const VALIDATED_DESIGN_PORTFOLIOS: Record<string, DesignPortfolioDetail> =
  Object.fromEntries(
    Object.entries(designPortfolios).map(([slug, detail]) => {
      const r = designPortfolioDetailSchema.safeParse(detail)
      if (!r.success) {
        throw new Error(
          `content/design-portfolios/${slug}.ts is invalid:\n` +
            JSON.stringify(r.error.format(), null, 2)
        )
      }
      return [slug, r.data]
    })
  )

const VALIDATED_WORK_DETAILS: Record<string, WorkDetail> = {
  ...VALIDATED_CASE_STUDIES,
  ...VALIDATED_PROJECT_DETAILS,
  ...VALIDATED_DESIGN_PORTFOLIOS,
}

const projectSlugs = new Set<string>()
const portfolioRanks = new Set<number>()

for (const project of VALIDATED_PROJECTS) {
  if (projectSlugs.has(project.slug)) {
    throw new Error(`Duplicate project slug: ${project.slug}`)
  }
  projectSlugs.add(project.slug)

  if (portfolioRanks.has(project.portfolioRank)) {
    throw new Error(`Duplicate portfolioRank: ${project.portfolioRank}`)
  }
  portfolioRanks.add(project.portfolioRank)

  const detail = VALIDATED_WORK_DETAILS[project.detailSlug]
  if (!detail) {
    throw new Error(
      `Project ${project.slug} points to missing detail ${project.detailSlug}`
    )
  }
  if (detail.presentationType !== project.presentationType) {
    throw new Error(
      `Project ${project.slug} is ${project.presentationType}, but its detail is ${detail.presentationType}`
    )
  }
  if (
    project.presentationType === 'case-study' &&
    detail.presentationType === 'case-study' &&
    project.proofLevel !== detail.evidence.level
  ) {
    throw new Error(
      `Project ${project.slug} uses ${project.proofLevel}, but its evidence record uses ${detail.evidence.level}`
    )
  }
}

const VALIDATED_EXPERIENCE: Experience[] = experience.map((e) =>
  experienceSchema.parse(e)
)

const VALIDATED_EDUCATION: Education[] = education.map((e) =>
  educationSchema.parse(e)
)

const VALIDATED_CERTIFICATIONS: Certification[] = certifications.map((c) =>
  certificationSchema.parse(c)
)

const VALIDATED_PLAYGROUND: PlaygroundItem[] = playground.map((p) =>
  playgroundSchema.parse(p)
)

const VALIDATED_TOOL_GROUPS: ToolGroup[] = toolGroups.map((g, i) => {
  const r = toolGroupSchema.safeParse(g)
  if (!r.success) {
    throw new Error(
      `content/skills.ts toolGroups[${i}] (${g.label ?? 'no label'}) is invalid:\n` +
        JSON.stringify(r.error.format(), null, 2)
    )
  }
  return r.data as ToolGroup
})

const VALIDATED_SKILLS: string[] = (() => {
  const r = skillsSchema.safeParse(skills)
  if (!r.success) {
    throw new Error(
      'content/skills.ts skills is invalid:\n' +
        JSON.stringify(r.error.format(), null, 2)
    )
  }
  return r.data
})()

// ── accessors ────────────────────────────────────────────────────────────

const byOrder = (a: { order: number }, b: { order: number }) => a.order - b.order

export async function getProfile(): Promise<Profile> {
  if (cmsEnabled()) return (await profileData()).profile as Profile
  return VALIDATED_PROFILE
}

/** Published professional work in its deliberate portfolio sequence. */
export async function getProjects(): Promise<Project[]> {
  if (cmsEnabled()) return (await readDocuments('work')).map(d => ({...(d.data.project as Project),slug:d.slug,title:d.title,detailSlug:d.slug})).sort((a,b)=>a.portfolioRank-b.portfolioRank)
  return VALIDATED_PROJECTS
    .filter((project) => project.status === 'published')
    .sort((a, b) => a.portfolioRank - b.portfolioRank)
}

export async function getProject(slug: string): Promise<Project | null> {
  if (cmsEnabled()) {const d=await readDocument('work',slug);return d?{...(d.data.project as Project),slug:d.slug,title:d.title,detailSlug:d.slug}:null}
  return VALIDATED_PROJECTS.find((p) => p.slug === slug) ?? null
}

export async function getProjectSlugs(): Promise<string[]> {
  if (cmsEnabled()) return (await readDocuments('work')).map(d=>d.slug)
  return VALIDATED_PROJECTS.map((p) => p.slug)
}

/**
 * The projects either side of `slug`, in the order /works lists them.
 * The sequence loops so the reader sidebar and the footer carousel agree.
 */
export async function getProjectNeighbours(
  slug: string
): Promise<{ prev: Project | null; next: Project | null }> {
  const all = await getProjects()
  const i = all.findIndex((p) => p.slug === slug)
  if (i === -1 || all.length < 2) return { prev: null, next: null }
  return {
    prev: all[(i - 1 + all.length) % all.length],
    next: all[(i + 1) % all.length],
  }
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  if (cmsEnabled()) {const d=await readDocument('work',slug);return d?workDetail(d) as CaseStudy:null}
  return VALIDATED_CASE_STUDIES[slug] ?? null
}

/** The presentation-specific detail attached to a professional work item. */
export async function getWorkDetailForProject(
  project: Project
): Promise<WorkDetail | null> {
  if (cmsEnabled()) {const d=await readDocument('work',project.slug);return d?workDetail(d):null}
  return VALIDATED_WORK_DETAILS[project.detailSlug] ?? null
}

export async function getExperience(): Promise<Experience[]> {
  if (cmsEnabled()) return [...(await profileData()).experience as Experience[]].sort(byOrder)
  return [...VALIDATED_EXPERIENCE].sort(byOrder)
}

export async function getEducation(): Promise<Education[]> {
  if (cmsEnabled()) return [...(await profileData()).education as Education[]].sort(byOrder)
  return [...VALIDATED_EDUCATION].sort(byOrder)
}

export async function getCertifications(): Promise<Certification[]> {
  if (cmsEnabled()) return [...(await profileData()).certifications as Certification[]].sort(byOrder)
  return [...VALIDATED_CERTIFICATIONS].sort(byOrder)
}

export async function getPlayground(): Promise<PlaygroundItem[]> {
  if (cmsEnabled()) return (await readDocuments('playground')).map(d=>({...d.data,slug:d.slug,title:d.title}) as unknown as PlaygroundItem).sort((a,b)=>a.playgroundRank-b.playgroundRank)
  return [...VALIDATED_PLAYGROUND].sort(
    (a, b) => a.playgroundRank - b.playgroundRank
  )
}

/** Recently added Playground items for the compact rail on /works. */
export async function getRecentPlayground(limit = 5): Promise<PlaygroundItem[]> {
  if (cmsEnabled()) return (await getPlayground()).sort((a,b)=>b.listedAt.localeCompare(a.listedAt)||a.playgroundRank-b.playgroundRank).slice(0,limit)
  return [...VALIDATED_PLAYGROUND]
    .sort((a, b) => b.listedAt.localeCompare(a.listedAt) || a.playgroundRank - b.playgroundRank)
    .slice(0, limit)
}

/** Practices, as opposed to the software they are practised with. */
export async function getSkills(): Promise<string[]> {
  if (cmsEnabled()) return (await profileData()).skills as string[]
  return [...VALIDATED_SKILLS]
}

export async function getToolGroups(): Promise<ToolGroup[]> {
  if (cmsEnabled()) return [...(await profileData()).toolGroups as ToolGroup[]].sort(byOrder)
  return [...VALIDATED_TOOL_GROUPS].sort(byOrder)
}

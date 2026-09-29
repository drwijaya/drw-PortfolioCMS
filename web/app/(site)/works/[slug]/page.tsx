import { mergePublishedMetadata } from '@/lib/cms/metadata'
import { readDocument } from '@/lib/cms/read'
import { cmsEnabled } from '@/lib/cms/db'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { WorkDetail } from '@/components/case-study/CaseStudy'
import {
  getProject,
  getProjectSlugs,
  getWorkDetailForProject,
} from '@/lib/content'

import './case-study.css'
import './detail.css'
import './storytelling.css'

export async function generateStaticParams() {
  if(cmsEnabled()) return []
  const slugs = await getProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return {}

  return mergePublishedMetadata({
    title: project.title,
    description: project.cardStatement,
    alternates: { canonical: `/works/${project.slug}` },
    openGraph: {
      type: 'article',
      url: `/works/${project.slug}`,
      title: project.title,
      description: project.cardStatement,
      images: [{ url: project.thumb }],
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: project.cardStatement,
      images: [project.thumb],
    },
  },await readDocument('work',slug))
}

export default async function WorksDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()

  const detail = await getWorkDetailForProject(project)
  if (!detail) notFound()

  return (
    <div className="project-detail-page is-reading">
      <WorkDetail detail={detail} project={project} />
    </div>
  )
}

import { mergePublishedMetadata } from '@/lib/cms/metadata'
import { notFound } from 'next/navigation'
import { cmsEnabled } from '@/lib/cms/db'
import { readDocument } from '@/lib/cms/read'
import { DocumentRenderer } from '@/components/cms/DocumentRenderer'
import type { Metadata } from 'next'

import { LegacyHashRedirect } from '@/components/home/LegacyHashRedirect'
import { WorksExplorer } from '@/components/projects/WorksExplorer'
import { getRecentPlayground, getProjects } from '@/lib/content'

const title = 'Selected Work: Industrial Engineering & Design'
const description =
  "Explore David Rizky Wijaya's projects in quality control, process improvement, systems analysis, digital products, and visual communication."
const socialImage =
  '/img/case-studies/juragan-cipung/dash-overview.png'

const defaultMetadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/works' },
  openGraph: {
    type: 'website',
    url: '/works',
    title,
    description,
    images: [{ url: socialImage }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [socialImage],
  },
}

export default async function WorksPage() {
  const cmsPage=await readDocument('page','works')
  if(cmsPage?.data.visible===false)notFound()
  if(cmsPage) return <DocumentRenderer document={cmsPage}/>
  if(cmsEnabled()) notFound()

  const [projects, playground] = await Promise.all([
    getProjects(),
    getRecentPlayground(),
  ])

  return (
    <>
      {/* /works is the front door now, so legacy `/#about`-style links land
          here with their fragment intact and are migrated after hydration. */}
      <LegacyHashRedirect />
      <WorksExplorer projects={projects} playground={playground} />
    </>
  )
}

export async function generateMetadata(){return mergePublishedMetadata(defaultMetadata,await readDocument('page','works'))}

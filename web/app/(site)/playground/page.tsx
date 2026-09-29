import { mergePublishedMetadata } from '@/lib/cms/metadata'
import { notFound } from 'next/navigation'
import { cmsEnabled } from '@/lib/cms/db'
import { readDocument } from '@/lib/cms/read'
import { DocumentRenderer } from '@/components/cms/DocumentRenderer'
import type { Metadata } from 'next'

import { PlaygroundExplorer } from '@/components/projects/PlaygroundExplorer'
import { getPlayground } from '@/lib/content'

const title = 'Playground: Personal Experiments & Interactive Projects'
const description =
  'Explore David Rizky Wijaya’s interactive experiments and personal projects, starting with Off the Clock: a little pixel island for life beyond work.'
const socialImage = '/img/off-the-clock/island-social.png'

const defaultMetadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/playground' },
  openGraph: {
    type: 'website',
    url: '/playground',
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

export default async function PlaygroundPage() {
  const cmsPage=await readDocument('page','playground')
  if(cmsPage?.data.visible===false)notFound()
  if(cmsPage) return <DocumentRenderer document={cmsPage}/>
  if(cmsEnabled()) notFound()

  return <PlaygroundExplorer items={await getPlayground()} />
}

export async function generateMetadata(){return mergePublishedMetadata(defaultMetadata,await readDocument('page','playground'))}

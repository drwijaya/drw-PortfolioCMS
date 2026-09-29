import { mergePublishedMetadata } from '@/lib/cms/metadata'
import { notFound } from 'next/navigation'
import { cmsEnabled } from '@/lib/cms/db'
import { readDocument } from '@/lib/cms/read'
import { DocumentRenderer } from '@/components/cms/DocumentRenderer'
import type { Metadata } from 'next'

import { ContactSection } from '@/components/home/ContactSection'

const description =
  'Contact David Rizky Wijaya about work opportunities, collaborations, or questions. Find his direct email address and get in touch.'

const defaultMetadata: Metadata = {
  title: 'Contact',
  description,
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    url: '/contact',
    title: 'Contact David Rizky Wijaya',
    description,
    images: [{ url: '/img/profile/profile-photo.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact David Rizky Wijaya',
    description,
    images: ['/img/profile/profile-photo.jpg'],
  },
}

export default async function ContactPage() {
  const cmsPage=await readDocument('page','contact')
  if(cmsPage?.data.visible===false)notFound()
  if(cmsPage) return <DocumentRenderer document={cmsPage}/>
  if(cmsEnabled()) notFound()

  return <ContactSection />
}

export async function generateMetadata(){return mergePublishedMetadata(defaultMetadata,await readDocument('page','contact'))}

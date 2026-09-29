import { mergePublishedMetadata } from '@/lib/cms/metadata'
import { notFound } from 'next/navigation'
import { cmsEnabled } from '@/lib/cms/db'
import { readDocument } from '@/lib/cms/read'
import { DocumentRenderer } from '@/components/cms/DocumentRenderer'
import type { Metadata } from 'next'

import { AboutSection } from '@/components/home/AboutSection'
import { getProfile } from '@/lib/content'
import { siteOrigin } from '@/lib/site-url'

const title = 'About · Industrial Engineering Background'
const description =
  "Learn about David Rizky Wijaya's Telkom University education, procurement experience, and work in process improvement, systems analysis, and data."

const defaultMetadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'profile',
    url: '/about',
    title: `${title} · David Rizky Wijaya`,
    description,
    images: [{ url: '/img/profile/profile-photo.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} · David Rizky Wijaya`,
    description,
    images: ['/img/profile/profile-photo.jpg'],
  },
}

export default async function AboutPage() {
  const cmsPage=await readDocument('page','about')
  if(cmsPage?.data.visible===false)notFound()
  if(cmsPage) return <DocumentRenderer document={cmsPage}/>
  if(cmsEnabled()) notFound()

  const profile = await getProfile()
  const url = new URL('/about', siteOrigin).toString()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profile`,
    url,
    name: `About ${profile.fullName}`,
    mainEntity: {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: profile.fullName,
      url,
      image: new URL(profile.photo, siteOrigin).toString(),
      description: profile.bio,
      sameAs: [profile.linkedinUrl, profile.githubUrl, profile.instagramUrl],
      alumniOf: { '@type': 'CollegeOrUniversity', name: 'Telkom University' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <AboutSection />
    </>
  )
}

export async function generateMetadata(){return mergePublishedMetadata(defaultMetadata,await readDocument('page','about'))}

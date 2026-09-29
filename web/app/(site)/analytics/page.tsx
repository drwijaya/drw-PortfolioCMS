import { siteSettings } from '@/lib/cms/read'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { getProjects } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Public, privacy-preserving analytics for davidrwijaya.site.',
  alternates: { canonical: '/analytics' },
  robots: { index: false, follow: false },
}

export default async function AnalyticsPage() {
  if((await siteSettings())?.analyticsPublic===false) notFound()
  const projects = await getProjects()
  return <AnalyticsDashboard projectSlugs={projects.map((project) => project.slug)} />
}

import { cmsEnabled } from '@/lib/cms/db'
import { permanentRedirect } from 'next/navigation'

import { getProjects } from '@/lib/content'

/**
 * The Flask site used numeric ids (/project/1). Anything already shared
 * should keep working, so map the old sort order onto the new slug.
 */
const LEGACY_ID_TO_SLUG: Record<string, string> = {
  '1': 'juragan-cipung',
}

export async function generateStaticParams() {
  if(cmsEnabled()) return []
  return Object.keys(LEGACY_ID_TO_SLUG).map((id) => ({ id }))
}

export default async function LegacyProjectRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const slug = LEGACY_ID_TO_SLUG[id]

  if (!slug) permanentRedirect('/works')

  // Guard against the map drifting out of sync with the content.
  const known = await getProjects()
  if (!known.some((p) => p.slug === slug)) permanentRedirect('/works')

  permanentRedirect(`/works/${slug}`)
}

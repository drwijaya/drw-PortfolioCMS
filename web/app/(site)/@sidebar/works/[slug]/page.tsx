import { cmsEnabled } from '@/lib/cms/db'
import { ReaderSidebar } from '@/components/sidebar/ReaderSidebar'
import { getProject, getProjectSlugs } from '@/lib/content'
import { Sidebar } from '@/components/sidebar/Sidebar'

export async function generateStaticParams() {
  if(cmsEnabled()) return []
  const slugs = await getProjectSlugs()
  return slugs.map((slug) => ({ slug }))
}

/**
 * On a case study the column stops being an identity and becomes wayfinding
 * for the document being read. Rendered on the server alongside the page, so
 * there is no default-sidebar flash to correct after hydration.
 */
export default async function ReaderSidebarSlot({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProject(slug)

  // An unknown slug 404s in the page; the slot keeps the normal column so
  // the not-found screen is not left without navigation.
  if (!project) return <Sidebar />

  return <ReaderSidebar project={project} />
}

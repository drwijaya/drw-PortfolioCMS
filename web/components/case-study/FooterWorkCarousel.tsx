import { getProjects } from '@/lib/content'

import { WorkCarousel } from './WorkCarousel'

/** Shared by static case studies and CMS-rendered work documents. */
export async function FooterWorkCarousel({ currentSlug }: { currentSlug: string }) {
  const projects = await getProjects()
  if (!projects.some((project) => project.slug === currentSlug)) return null

  return (
    <WorkCarousel
      key={currentSlug}
      currentSlug={currentSlug}
      projects={projects.map(({ slug, title, thumb, presentationType, practice, year }) => ({
        slug,
        title,
        thumb,
        presentationType,
        practice,
        year,
      }))}
    />
  )
}

'use client'

import { LayoutGroup } from 'motion/react'
import { useState } from 'react'

import { HoverThumb } from './HoverThumb'
import { sizeOf } from '@/content/image-sizes'
import { MasonryGrid } from './MasonryGrid'
import { ProjectRow } from './ProjectRow'
import { useFinePointer } from '@/lib/useFinePointer'
import type { Project } from '@/lib/types'
import type { View } from '@/components/ui/ViewToggle'
import styles from './Projects.module.css'

/**
 * Grid ↔ list. Both branches render the SAME items with the same layoutIds,
 * so Motion interpolates tiles into rows instead of unmounting and
 * remounting them. That is the showpiece: a rearrangement, not a reload.
 */
export function ProjectsView({
  projects,
  view,
  animateEntrance = true,
}: {
  projects: Project[]
  view: View
  animateEntrance?: boolean
}) {
  const [active, setActive] = useState<string | null>(null)
  const fine = useFinePointer()

  return (
    <LayoutGroup id="projects">
      {view === 'grid' ? (
        <div>
          <MasonryGrid
            projects={projects}
            animateEntrance={animateEntrance}
          />
        </div>
      ) : (
        <div className={styles.table} onPointerLeave={() => setActive(null)}>
          {projects.map((p, i) => (
            <ProjectRow
              key={p.slug}
              project={p}
              index={i + 1}
              onActivate={() => setActive(p.slug)}
            />
          ))}
        </div>
      )}

      {/* list view only; the grid already shows every image in place */}
      {fine && view === 'list' && (
        <HoverThumb
          images={projects.map((project) => ({
            slug: project.slug,
            src: project.thumb,
            ...sizeOf(project.thumb),
          }))}
          activeSlug={active}
        />
      )}
    </LayoutGroup>
  )
}

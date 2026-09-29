'use client'

import { ProjectTile } from './ProjectTile'
import type { Project } from '@/lib/types'
import styles from './Projects.module.css'

/**
 * Two columns, row-major, each tile as tall as its own image.
 *
 * This used to pack masonry-style by computing a grid row span from the
 * image's intrinsic ratio against a nominal 520px column. That only holds
 * while the column really is ~520px wide; once the grid fills the canvas a
 * tile is taller than the rows reserved for it and overlaps its neighbour.
 * Aligning to the top of each row is correct at every width, and with a
 * handful of projects it looks the same.
 */
export function MasonryGrid({
  projects,
  animateEntrance = true,
}: {
  projects: Project[]
  animateEntrance?: boolean
}) {
  return (
    <div className={styles.masonry}>
      {projects.map((p, i) => (
        <div key={p.slug} className={styles.masonryItem}>
          <ProjectTile
            project={p}
            index={i}
            priority={i < 2}
            animateEntrance={animateEntrance}
          />
        </div>
      ))}
    </div>
  )
}

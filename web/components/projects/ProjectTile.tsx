'use client'

import Image from '@/components/cms/ContentImage'
import { motion } from 'motion/react'
import { useRef } from 'react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { sizeOf } from '@/content/image-sizes'
import { DUR, LAYOUT } from '@/lib/motion'
import type { Project } from '@/lib/types'
import { useEntranceAnimation } from '@/lib/useEntranceAnimation'
import { projectTransitionNames, vt } from '@/lib/view-transition'
import { workTypeCta, workTypeLabel } from '@/lib/work'
import styles from './Projects.module.css'

interface Props {
  project: Project
  index?: number
  priority?: boolean
  animateEntrance?: boolean
}

/**
 * The one tile. The column sets the width; the image sets the height, so a
 * wide capstone photo and a tall diagram both arrive uncropped. layoutId
 * lets it morph into a ProjectRow when the view toggles.
 */
export function ProjectTile({
  project,
  index = 0,
  priority = false,
  animateEntrance = true,
}: Props) {
  const cursor = useCursor()
  // One expression, used by the tile's own CTA and by the cursor disc, so
  // the two can never say different things about the same tile.
  const cta = workTypeCta(project.presentationType)
  const typeLabel = workTypeLabel(project.presentationType)
  const transitionNames = projectTransitionNames(project.slug)
  const thumb = sizeOf(project.thumb)
  const frameRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)

  useEntranceAnimation(frameRef, {
    enabled: animateEntrance,
    clip: true,
    index,
    duration: DUR.page,
  })
  useEntranceAnimation(captionRef, {
    enabled: animateEntrance,
    after: DUR.tap,
    index,
  })

  return (
    <div
      className={`${styles.tile} ${
        project.presentationType === 'case-study' ? styles.tileFeatured : ''
      }`}
    >
      <TransitionLink
        href={`/works/${project.slug}`}
        className={styles.tileLink}
        {...cursor.bind('view', cta)}
      >
        {/* No partner on the case study any more, so this is an exit: the
            frame leaves as one piece with the stage. */}
        <motion.div
          ref={frameRef}
          layout
          layoutId={`project:${project.slug}:frame`}
          transition={LAYOUT.morph}
          {...vt(transitionNames.image, styles.frame)}
        >
          <Image
            src={project.thumb}
            alt={project.title}
            width={thumb.width}
            height={thumb.height}
            sizes="(max-width: 899px) 100vw, 46vw"
            className={styles.img}
            priority={priority}
            fetchPriority={priority ? 'high' : undefined}
          />

          {/* One continuous stroke rather than four edges pretending to be
              one. pathLength normalises the perimeter so a single dash
              covers any tile size. rx mirrors --radius-sm. */}
          <svg className={styles.outline} aria-hidden focusable="false">
            <rect
              className={styles.outlineRect}
              x="0"
              y="0"
              width="100%"
              height="100%"
              rx="8"
              pathLength="1"
            />
          </svg>

          {/* Decoration, not the only copy: the full list is on the
              project's own page, so these are hidden from the reader. */}
          {project.methods.length > 0 && (
            <div className={styles.tagRow} aria-hidden>
              {project.methods.slice(0, 3).map((tag) => (
                <span className={styles.tileTag} key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <div ref={captionRef} className={styles.cap}>
          <motion.h2
            layout
            layoutId={`project:${project.slug}:title`}
            transition={LAYOUT.morph}
            {...vt(transitionNames.title, styles.capTitle)}
          >
            {project.title}
            {project.status === 'in_progress' && <span className={styles.chip}>in progress</span>}
          </motion.h2>

          <p className={styles.capMeta}>
            <span className={styles.capType}>{typeLabel}</span>
            <span>{project.practice} · {project.sector} · {project.year}</span>
          </p>

          <p className={styles.capDesc}>
            {project.cardStatement}
          </p>
          <span className={styles.capCta}>
            {cta}{' '}
            <span aria-hidden>→</span>
          </span>
        </div>
      </TransitionLink>
    </div>
  )
}

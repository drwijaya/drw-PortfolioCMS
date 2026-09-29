'use client'

import Image from '@/components/cms/ContentImage'
import { motion } from 'motion/react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { DUR, EASE, LAYOUT } from '@/lib/motion'
import type { Project } from '@/lib/types'
import { projectTransitionNames, vt } from '@/lib/view-transition'
import { workTypeLabel } from '@/lib/work'
import styles from './Projects.module.css'

interface Props {
  project: Project
  index: number
  onActivate?: () => void
}

/**
 * The list-view row. Shares layoutId with ProjectTile, so switching views
 * is a rearrangement rather than a re-render.
 */
export function ProjectRow({ project, index, onActivate }: Props) {
  const cursor = useCursor()
  const transitionNames = projectTransitionNames(project.slug)

  return (
    <div
      className={`${styles.row} ${project.status !== 'published' ? styles.rowMuted : ''}`}
    >
      <TransitionLink
        href={`/works/${project.slug}`}
        className={styles.rowLink}
        onPointerEnter={onActivate}
        onFocus={onActivate}
        {...cursor.bind('soft')}
      >
        <motion.h2
          className={styles.rowIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.quick, ease: EASE.out, delay: 0.12 }}
        >
          {String(index).padStart(2, '0')}
        </motion.h2>

        <motion.span
          layout
          layoutId={`project:${project.slug}:frame`}
          transition={LAYOUT.morph}
          {...vt(transitionNames.image, styles.rowThumb)}
        >
          <Image
            src={project.thumb}
            alt=""
            width={64}
            height={44}
            className={styles.rowThumbImg}
          />
        </motion.span>

        <span className={styles.rowIdentity}>
          <motion.span
            layout
            layoutId={`project:${project.slug}:title`}
            transition={LAYOUT.morph}
            {...vt(transitionNames.title, styles.rowTitle)}
          >
            {project.title}
            {project.status === 'in_progress' && <span className={styles.chip}>in progress</span>}
          </motion.span>
        </span>

        <motion.span
          className={styles.rowMeta}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.quick, ease: EASE.out, delay: 0.12 }}
        >
          {workTypeLabel(project.presentationType)} · {project.practice}
        </motion.span>

        <motion.span
          className={styles.rowYear}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DUR.quick, ease: EASE.out, delay: 0.12 }}
        >
          {project.year}
        </motion.span>

        <span className={styles.rowArrow} aria-hidden>
          →
        </span>
      </TransitionLink>
    </div>
  )
}

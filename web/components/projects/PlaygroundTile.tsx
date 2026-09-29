'use client'

import Image from '@/components/cms/ContentImage'
import { motion } from 'motion/react'
import { useRef } from 'react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { DUR, LAYOUT, SPRING } from '@/lib/motion'
import type { PlaygroundItem } from '@/lib/types'
import { useEntranceAnimation } from '@/lib/useEntranceAnimation'
import { workTypeCta } from '@/lib/work'

import styles from './Projects.module.css'

export function PlaygroundTile({
  item,
  index = 0,
  compact = false,
  animateEntrance = true,
}: {
  item: PlaygroundItem
  index?: number
  compact?: boolean
  animateEntrance?: boolean
}) {
  const cursor = useCursor()
  const frameRef = useRef<HTMLDivElement>(null)
  const captionRef = useRef<HTMLDivElement>(null)
  const cta = workTypeCta('playground')

  useEntranceAnimation(frameRef, {
    enabled: animateEntrance,
    clip: true,
    index,
    observe: true,
    duration: DUR.page,
  })
  useEntranceAnimation(captionRef, { enabled: animateEntrance, after: DUR.tap, index, observe: true })

  const card = (
    <>
      <motion.div
        ref={frameRef}
        layout
        layoutId={`playground:${item.slug}:frame`}
        transition={compact ? LAYOUT.morph : SPRING.snap}
        className={styles.frame}
      >
        <Image
          src={item.preview}
          alt={item.title}
          width={item.previewWidth}
          height={item.previewHeight}
          sizes={compact ? '(max-width: 679px) 78vw, 300px' : '(max-width: 899px) 100vw, 46vw'}
          className={styles.img}
          priority={!compact && index === 0}
        />
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
        <div className={styles.tagRow} aria-hidden>
          <span className={styles.tileTag}>{item.medium}</span>
          <span className={styles.tileTag}>{item.status.replace('_', ' ')}</span>
        </div>
      </motion.div>

      <motion.div ref={captionRef} layout={!compact} className={styles.cap}>
        <motion.h2
          layout
          layoutId={`playground:${item.slug}:title`}
          transition={compact ? LAYOUT.morph : SPRING.snap}
          className={styles.capTitle}
        >
          {item.title}
        </motion.h2>
        <p className={styles.capMeta}>
          <span className={styles.capType}>Playground</span>
          <span>{item.medium} · {item.listedAt.slice(0, 4)}</span>
        </p>
        <p className={styles.capDesc}>{item.premise}</p>
        <span className={styles.capCta}>
          {cta} <span aria-hidden>→</span>
        </span>
      </motion.div>
    </>
  )

  return (
    <motion.div
      layout={!compact}
      layoutId={compact ? undefined : `playground:${item.slug}`}
      transition={SPRING.snap}
      className={`${styles.tile} ${compact ? styles.playgroundCompact : ''}`}
    >
      {item.destinationType === 'external' ? (
        <a
          href={item.destination}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.tileLink}
          {...cursor.bind('view', cta)}
        >
          {card}
        </a>
      ) : (
        <TransitionLink
          href={item.destination}
          className={styles.tileLink}
          {...cursor.bind('view', cta)}
        >
          {card}
        </TransitionLink>
      )}
    </motion.div>
  )
}

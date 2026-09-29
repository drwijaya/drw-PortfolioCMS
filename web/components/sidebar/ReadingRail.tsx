'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { reading } from '@/lib/case-study/reading-store'
import { DUR, EASE, TRAVEL } from '@/lib/motion'
import styles from './Sidebar.module.css'

const ROMAN = [
  'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
  'xi', 'xii', 'xiii', 'xiv', 'xv',
]

const pad = (n: number) => String(n).padStart(2, '0')

export interface Chapter {
  id: string
  label: string
  lead: string
}

/**
 * The wayfinding half of the reader column: which chapter you are in, what
 * it is about, where the others are, and how much is left.
 *
 * The scroll controller publishes to `reading`; this subscribes. The active
 * chapter goes through React (it changes ten times in a long document), the
 * progress value does not (it changes every frame, so it is written straight
 * to the DOM through refs).
 */
export function ReadingRail({
  chapters,
  slug,
}: {
  chapters: Chapter[]
  slug: string
}) {
  // Named reads only. The store may still be holding the previous case
  // study's chapter when this renders; asking on behalf of `slug` returns
  // null in that window rather than a chapter from another document.
  const getActive = useCallback(() => reading.getActive(slug), [slug])
  const activeId = useSyncExternalStore(
    reading.subscribeActive,
    getActive,
    reading.getServerActive
  )
  const reduced = useReducedMotion()
  const cursor = useCursor()
  const barRef = useRef<HTMLSpanElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)

  useEffect(
    () =>
      reading.subscribeProgress(slug, (value) => {
        if (barRef.current) barRef.current.style.transform = `scaleX(${value})`
        if (pctRef.current) {
          pctRef.current.textContent = `${Math.round(value * 100)}%`
        }
      }),
    [slug]
  )

  const isOverview = activeId === null
  const found = chapters.findIndex((c) => c.id === activeId)
  const index = found < 0 ? 0 : found
  const current = chapters[index]

  return (
    <div className={styles.rail}>
      {/* Repeats the index below and changes while you scroll. Announcing
          it would chatter, so the index is the accessible copy. */}
      <div className={styles.railCurrent} aria-hidden>
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={current.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: TRAVEL.xs }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -TRAVEL.xs }}
            transition={{ duration: DUR.quick, ease: EASE.out }}
          >
            <span className={`${styles.railNum} display`}>{pad(index + 1)}</span>
            <span className={styles.railLabel}>{current.label}</span>
            <p className={styles.railSummary}>{current.lead}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className={styles.railIndex} aria-label="Chapters">
        <a
          href="#cs-overview"
          className={`${styles.railItem} ${styles.railOverview} ${isOverview ? styles.railItemCurrent : ''}`}
          aria-current={isOverview ? 'location' : undefined}
          aria-label="Back to overview"
          {...cursor.bind('soft')}
        >
          <span className={styles.railItemNum} aria-hidden>↥</span>
          <span className={styles.railItemLabel}>Overview</span>
        </a>
        {chapters.map((chapter, i) => {
          const isCurrent = !isOverview && i === index
          return (
            <a
              key={chapter.id}
              href={`#cs-${chapter.id}`}
              className={`${styles.railItem} ${isCurrent ? styles.railItemCurrent : ''}`}
              aria-current={isCurrent ? 'location' : undefined}
              {...cursor.bind('soft')}
            >
              <span className={styles.railItemNum} aria-hidden>
                {ROMAN[i] ?? i + 1}
              </span>
              <span className={styles.railItemLabel}>{chapter.label}</span>
            </a>
          )
        })}
      </nav>

      {/* Per-frame value is decorative; the announced value is the chapter. */}
      <div
        className={styles.railProgress}
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={1}
        aria-valuemax={chapters.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Chapter ${index + 1} of ${chapters.length}`}
      >
        <span className={styles.railTrack} aria-hidden>
          <span className={styles.railBar} ref={barRef} />
        </span>
        <span className={styles.railPct} ref={pctRef} aria-hidden>
          0%
        </span>
      </div>
    </div>
  )
}

'use client'

import { motion } from 'motion/react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { SPRING } from '@/lib/motion'
import styles from './ViewToggle.module.css'

export type View = 'grid' | 'list'

/**
 * Two text labels, not a segmented control. That is Option A's restraint.
 * This is local presentation state, not navigation: changing the layout
 * should not create another URL or browser-history entry.
 */
export function ViewToggle({
  value,
  onChange,
}: {
  value: View
  onChange: (view: View) => void
}) {
  const cursor = useCursor()

  function set(next: View) {
    if (next === value) return
    onChange(next)
  }

  return (
    <div className={styles.wrap} role="group" aria-label="View">
      {(['grid', 'list'] as const).map((v, i) => (
        <span key={v} className={styles.slot}>
          {i > 0 && (
            <span className={styles.sep} aria-hidden>
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => set(v)}
            aria-pressed={value === v}
            className={`${styles.btn} ${value === v ? styles.on : ''}`}
            {...cursor.bind('soft')}
          >
            {v}
            {value === v && (
              <motion.span
                layoutId="view-underline"
                className={styles.underline}
                transition={SPRING.snap}
              />
            )}
          </button>
        </span>
      ))}
    </div>
  )
}

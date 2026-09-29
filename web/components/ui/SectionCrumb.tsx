'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { DUR, EASE, TRAVEL } from '@/lib/motion'
import styles from './PageHeader.module.css'

export interface Crumb {
  /** the `id` given to that section's own <PageHeader /> */
  id: string
  label: string
}

/**
 * The sticky page header keeps the page name; this appends whichever section
 * has scrolled underneath it, so "About" reads "About / Experience". The
 * section's own header slides away as it always did. The label is never
 * lost, only handed up.
 */
export function SectionCrumb({ sections }: { sections: Crumb[] }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState<Crumb | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // The trigger line is the foot of the sticky bar itself: a section
    // becomes current at the exact moment its own header is swallowed.
    const bar = node.closest('[data-page-header]') ?? node
    let frame = 0

    const measure = () => {
      frame = 0
      const line = bar.getBoundingClientRect().bottom
      let current: Crumb | null = null
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el && el.getBoundingClientRect().top <= line) current = section
      }
      setActive((prev) => (prev?.id === current?.id ? prev : current))
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [sections])

  return (
    // Decorative: the section's real heading is already in the a11y tree.
    <span className={styles.crumb} ref={ref} aria-hidden>
      <AnimatePresence initial={false} mode="wait">
        {active && (
          <motion.span
            key={active.id}
            className={styles.crumbCurrent}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: TRAVEL.xs }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -TRAVEL.xs }}
            transition={{ duration: DUR.quick, ease: EASE.out }}
          >
            <span className={styles.crumbSlash}>/</span>
            {active.label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

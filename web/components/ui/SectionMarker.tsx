'use client'

import { useRef } from 'react'

import { useEntranceAnimation } from '@/lib/useEntranceAnimation'
import styles from './SectionMarker.module.css'

/**
 * The reading view's chapter opener, lifted out of case-study.css for pages
 * that are documents but not case studies. A numeral, a tracked label, and a
 * hairline that runs to the column's right edge: roughly 34px of chrome
 * where <PageHeader /> spends 120.
 *
 * No progress fill: the fill on .cs-section-marker tracks reading position,
 * and a page without a reader column has none to track.
 */
export function SectionMarker({
  id,
  num,
  label,
}: {
  /** anchor for the sticky header's crumb, and for deep links */
  id?: string
  num: string
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEntranceAnimation(ref, { observe: true })

  return (
    <div ref={ref} id={id} className={styles.marker}>
      <span className={`${styles.num} display`} aria-hidden>
        {num}
      </span>
      <h2 className={styles.label}>{label}</h2>
      <i className={styles.rule} aria-hidden />
    </div>
  )
}

'use client'

import { useRef, type ReactNode } from 'react'

import { useEntranceAnimation } from '@/lib/useEntranceAnimation'
import { SectionCrumb, type Crumb } from './SectionCrumb'
import styles from './PageHeader.module.css'

/**
 * The one page header. Every route uses it, which is the entire reason
 * /works stopped looking like a different website.
 *
 * Option A ("Quiet Index"): a small tracked label and a hairline. No page
 * gets a display-face title. The sidebar is the only identity on screen.
 */
export function PageHeader({
  label,
  actions,
  first = false,
  as = 'h2',
  id,
  sections,
  breadcrumb,
}: {
  breadcrumb?: ReactNode
  label: string
  /** right-hand slot: the view toggle, a count, a link */
  actions?: ReactNode
  first?: boolean
  as?: 'h1' | 'h2'
  /** anchor for the sticky header's crumb (and for deep links) */
  id?: string
  /** on the sticky header only: the sections it should trail */
  sections?: Crumb[]
}) {
  const Heading = as
  const ref = useRef<HTMLDivElement>(null)
  useEntranceAnimation(ref, { observe: !first })

  return (
    <div
      ref={ref}
      id={id}
      data-page-header
      className={`${styles.row} ${first ? styles.first : ''}`}
    >
      <div className={styles.headingGroup}>
        <Heading className={breadcrumb ? "sr-only" : styles.label}>{label}</Heading>
        {breadcrumb}
        {sections && sections.length > 0 && <SectionCrumb sections={sections} />}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import type { MouseEvent } from 'react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { LinkIcon } from '@/components/icons'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { SPRING } from '@/lib/motion'
import styles from './Sidebar.module.css'

interface Props {
  href: string
  label: string
  /** roman numeral; the sequence runs unbroken across both groups */
  numeral: string
  external?: boolean
  activePaths?: readonly string[]
  /** the stacked sidebar group, or the horizontal bar at the foot of a phone */
  variant?: 'column' | 'dock'
  /** distinct per variant: two mounted copies must not share one ink */
  layoutId?: string
  /** the destination this pill stands for, independent of where it currently
   *  points — the Works tab can point at a project it remembers */
  tab?: string
  /** how far down the remembered page the reader had got */
  restoreScroll?: number
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

export function NavPill({
  href,
  label,
  numeral,
  external = false,
  activePaths,
  variant = 'column',
  layoutId = 'nav-active',
  tab,
  restoreScroll,
  onClick,
}: Props) {
  const pathname = usePathname()
  const cursor = useCursor()
  const activeByRoute = activePaths?.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const current = !external && Boolean(activeByRoute)

  const inner = (
    <>
      {/* The fill is its own element with a shared layoutId, so it SLIDES
          between pills rather than cross-fading. */}
      {current && (
        <motion.span
          layoutId={layoutId}
          className={styles.pillInk}
          transition={SPRING.snap}
          aria-hidden
        />
      )}
      <span className={styles.pillNumeral} aria-hidden>
        {numeral}
      </span>
      <span className={styles.pillLabel}>{label}</span>
      {external ? (
        <span className={styles.pillLinkIcon} aria-hidden>
          <LinkIcon />
        </span>
      ) : (
        <span className={styles.pillDot} aria-hidden />
      )}
    </>
  )

  const className = [
    styles.pill,
    variant === 'dock' ? styles.pillDock : '',
    current ? styles.pillCurrent : '',
  ]
    .filter(Boolean)
    .join(' ')

  if (external) {
    return (
      <a
        href={href}
        data-tab={tab}
        className={className}
        target={href.startsWith('mailto:') ? undefined : '_blank'}
        rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
        {...cursor.bind('soft')}
      >
        {inner}
      </a>
    )
  }

  return (
    <TransitionLink
      href={href}
      restoreScroll={restoreScroll}
      onClick={onClick}
      data-tab={tab}
      className={className}
      aria-current={current ? 'page' : undefined}
      {...cursor.bind('soft')}
    >
      {inner}
    </TransitionLink>
  )
}

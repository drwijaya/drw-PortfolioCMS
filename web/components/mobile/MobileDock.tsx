'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ChevronUp } from '@/components/icons'
import { useCursor } from '@/components/cursor/CursorProvider'
import { PrimaryNav } from '@/components/sidebar/PrimaryNav'
import styles from './Mobile.module.css'

const PANEL_ID = 'dock-panel'

/**
 * The bottom edge on a phone: four destinations and one disclosure.
 *
 * ── Why this lives in the layout and not in the @sidebar slot ──────────
 *
 * The slot swaps whole trees: <Sidebar /> for most routes, <ReaderSidebar />
 * for a case study. Put the tab bar inside it and the bar unmounts on every
 * entry to and exit from a project, which breaks MOTION-SYSTEM rule 5, drops
 * the ink's layout partner so the fill jumps instead of sliding, and resets
 * the drawer. So the bar is owned by the layout and never unmounts, and the
 * slot supplies only what goes INSIDE the drawer.
 *
 * ── Why the open state is an attribute and not a context ───────────────
 *
 * The panel is the <aside> the slot rendered, which is a server tree. Handing
 * it React state means threading a prop through the layout or turning it into
 * a client component. Writing `data-dock` on <html> costs one attribute and
 * is the idiom this codebase already runs on: data-theme, data-cursor,
 * data-route-transition, data-route-direction. CSS positions the aside as the
 * drawer and reads the attribute to open it.
 *
 * ── What closes it ────────────────────────────────────────────────────
 *
 * The chevron, Escape, the scrim, and any route change. There is no
 * swipe-down: the only surface a downward drag could start on is the chapter
 * index, which scrolls, and a gesture that sometimes scrolls and sometimes
 * dismisses is worse than no gesture at all.
 */
export function MobileDock() {
  const pathname = usePathname()
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  const cursor = useCursor()
  const chevronRef = useRef<HTMLButtonElement>(null)
  // Nothing to restore focus to on the first paint, and focusing the panel
  // on mount would steal the caret from a deep link.
  const opened = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    if (open) root.dataset.dock = 'open'
    else delete root.dataset.dock
    return () => {
      delete root.dataset.dock
    }
  }, [open])

  // Focus follows the disclosure, in both directions. The panel carries
  // tabindex="-1" so it can receive this without joining the tab order.
  useEffect(() => {
    if (open) {
      opened.current = true
      document.getElementById(PANEL_ID)?.focus({ preventScroll: true })
    } else if (opened.current) {
      chevronRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenAt(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // A drawer that survived a route change would be showing the previous
  // page's context over the new one.
  const toggle = useCallback(
    () => setOpenAt((current) => current === pathname ? null : pathname),
    [pathname]
  )

  return (
    <>
      {/* Painted only while open, and it is the reason a tap anywhere on the
          page dismisses the drawer rather than doing nothing. */}
      <div
        className={styles.scrim}
        data-open={open || undefined}
        onClick={() => setOpenAt(null)}
        aria-hidden
      />

      {/* Sibling, not ::before — see MobileHeader. */}
      <div className={styles.veil} data-chrome="veil" data-edge="bottom" aria-hidden />

      <div className={styles.dock} data-chrome="dock">
        <PrimaryNav variant="dock" className={styles.bar} />

        <button
          ref={chevronRef}
          type="button"
          className={styles.chevron}
          data-open={open || undefined}
          aria-expanded={open}
          aria-controls={PANEL_ID}
          aria-label={open ? 'Close details' : 'Open details'}
          onClick={toggle}
          {...cursor.bind('soft')}
        >
          <ChevronUp className={styles.chevronGlyph} />
        </button>
      </div>
    </>
  )
}

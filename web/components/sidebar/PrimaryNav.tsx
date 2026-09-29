'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react'

import { NavPill } from './NavPill'
import {
  TAB_ROOT,
  getMarksVersion,
  markFor,
  markLeaving,
  noteScroll,
  subscribeMarks,
  tabOf,
  type Mark,
  type TabKey,
} from '@/lib/tab-memory'
import { useHydrated } from '@/lib/use-hydrated'
import styles from './Sidebar.module.css'

import { ROMAN } from './nav-items'
import { useSiteConfig } from '@/components/cms/SiteConfig'

const subscribeNoop = () => () => {}
const getZeroSnapshot = () => 0

/**
 * Keeps every tab's mark current: where you are, and how far down it.
 *
 * Two listeners and one effect. The scroll listener is passive and writes to
 * a Map, so it costs a property assignment per frame and nothing else. The
 * flush happens when the path CHANGES, and it flushes the path being left —
 * the browser has already zeroed `window.scrollY` for the new one by then,
 * which is exactly the trap this avoids.
 */
function useTabMarks(enabled: boolean, pathname: string) {
  const previous = useRef(pathname)

  useEffect(() => {
    if (!enabled) return
    const onScroll = () => noteScroll(window.location.pathname, window.scrollY)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled, pathname])

  // The store subscription supplies a follow-up render, while the layout
  // effect commits the route being left before the browser paints new hrefs.
  // Refs remain lifecycle data and are never read during render.
  useSyncExternalStore(
    enabled ? subscribeMarks : subscribeNoop,
    enabled ? getMarksVersion : getZeroSnapshot,
    getZeroSnapshot
  )

  useLayoutEffect(() => {
    if (!enabled || previous.current === pathname) return
    markLeaving(previous.current)
    previous.current = pathname
  }, [enabled, pathname])
}

/**
 * The destinations, in one place, worn two ways.
 *
 * `column` is the stacked group in the desktop sidebar. `dock` is the
 * horizontal bar at the foot of a phone. Both render at every width and one
 * is always `display: none`, which is what keeps the bar from unmounting
 * when the parallel sidebar slot swaps a case study in (MOTION-SYSTEM rule
 * 5: persistent chrome never re-animates). `display: none` also takes the
 * hidden copy out of the accessibility tree, so there is exactly one
 * "Primary" landmark exposed at any width.
 *
 * The two carry DIFFERENT `layoutId`s on purpose. One id across two mounted
 * elements makes Motion animate the ink between them, and the hidden copy
 * measures 0 x 0, so the fill would fly to a corner on the first render.
 *
 * Tab memory is the dock's alone. The desktop reader column has its own
 * "Back to works", its pills are not even rendered while a case study is
 * open, and changing where a visible link points based on invisible state is
 * a worse trade at a width where nothing is hidden.
 */
export function PrimaryNav({
  variant,
  className,
}: {
  variant: 'column' | 'dock'
  className?: string
}) {
  const config=useSiteConfig()
  const menu=config.items.filter(i=>i.visible&&i.location==='main').map(i=>({href:i.href,label:i.label,tab:i.id,activePaths:i.href==='/works'?['/works','/']:[i.href]}))
  const pathname = usePathname()
  const remembers = variant === 'dock'
  useTabMarks(remembers, pathname)

  const here = tabOf(pathname)
  // Recomputed after hydration only. The first render has to match the
  // server, which knows nothing about where anyone has been.
  const hydrated = useHydrated()

  const targetFor = useCallback(
    (tab: TabKey): Mark => {
      if (!remembers || !hydrated) return { path: TAB_ROOT[tab]??menu.find(i=>i.tab===tab)?.href??'/works', y: 0 }
      // The tab you are already on pops to its own index, the way every
      // native tab bar does. That is also the second way out of a case study.
      if (tab === here) return { path: TAB_ROOT[tab]??menu.find(i=>i.tab===tab)?.href??'/works', y: 0 }
      return markFor(tab)
    },
    [remembers, hydrated, here, menu]
  )

  // Tapping the tab you are on when you are ALREADY at its index is the
  // universal "back to top" gesture. Nothing to navigate to, so the link
  // stands aside and does it directly.
  const onSameSpot = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, path: string) => {
      if (!remembers || path !== pathname) return
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [remembers, pathname]
  )

  return (
    <nav
      className={className ?? styles.group}
      aria-label="Primary"
      data-nav={variant}
    >
      {(variant==='dock'?menu.slice(0,4):menu).map((item, i) => {
        const target = TAB_ROOT[item.tab] ? targetFor(item.tab) : {path:item.href,y:0}
        return (
          <NavPill
            key={item.href}
            label={item.label}
            activePaths={item.activePaths}
            href={target.path}
            restoreScroll={target.y}
            onClick={(event) => onSameSpot(event, target.path)}
            tab={item.tab}
            numeral={ROMAN[i]}
            variant={variant}
            layoutId={`nav-active-${variant}`}
          />
        )
      })}
    </nav>
  )
}

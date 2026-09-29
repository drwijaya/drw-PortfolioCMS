'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'

import { DUR, EASE, TRAVEL, delayFor } from '@/lib/motion'

const easing = `cubic-bezier(${EASE.out.join(',')})`

/**
 * The parallel sidebar slot swaps server-rendered trees. On browsers without
 * native View Transitions, animate only that reader-bound swap; ordinary
 * navigation keeps the persistent portfolio chrome completely still.
 */
export function SidebarEntrance({
  children,
  variant,
}: {
  children: ReactNode
  variant: 'site' | 'reader'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (
      document.documentElement.dataset.routeTransition !== 'fallback' ||
      document.documentElement.dataset.routeTransitionKind !== 'reader'
    ) {
      return
    }

    const root = ref.current
    if (!root) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const items = Array.from(root.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    )
    const animations = items.map((item, index) => {
      const animation = item.animate(
        [
          {
            opacity: 0,
            transform: reduced
              ? 'none'
              : `translate3d(0, ${TRAVEL.sm}px, 0)`,
          },
          { opacity: 1, transform: 'none' },
        ],
        {
          duration: (reduced ? DUR.reduced : DUR.base) * 1000,
          delay: (reduced ? 0 : delayFor(index)) * 1000,
          easing,
          fill: 'both',
        }
      )
      void animation.finished.then(() => animation.cancel()).catch(() => {})
      return animation
    })

    return () => animations.forEach((animation) => animation.cancel())
  }, [variant])

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}

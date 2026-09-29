'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'

import { DUR, EASE, TRAVEL, delayFor } from '@/lib/motion'

/**
 * Owns the lifecycle of the case-study controller.
 *
 * Server-rendered content is visible without JavaScript. The lightweight
 * controller loads on every viewport for progress, deep links, and lightbox
 * behavior. GSAP is injected only for capable desktop/fine-pointer layouts.
 */
export function CaseStudyScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  /*
   * GSAP is loaded asynchronously for scrollytelling, which is too late to
   * own the first paint. When the route provider uses its cross-browser
   * fallback, give the opening block an immediate entrance here.
   * Server HTML remains visible when JavaScript or WAAPI is unavailable.
   */
  useLayoutEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>('[data-case-study]')
    const items = root?.querySelectorAll<HTMLElement>('.cs-hero > *')
    if (!items?.length) return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const fallbackTransitionActive =
      document.documentElement.dataset.routeTransition === 'fallback'

    // A direct server render must stay visible; only an active fallback
    // navigation may prepare the hero before its first destination paint.
    if (!fallbackTransitionActive) return

    const animations = Array.from(items).map((item, index) => {
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
          duration: (reduced ? DUR.reduced : DUR.move) * 1000,
          delay: (reduced ? 0 : delayFor(index)) * 1000,
          easing: `cubic-bezier(${EASE.out.join(',')})`,
          fill: 'both',
        },
      )

      void animation.finished.then(() => animation.cancel()).catch(() => {})
      return animation
    })

    return () => animations.forEach((animation) => animation.cancel())
  }, [])

  useEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>('[data-case-study]')
    if (!root) return

    const media = window.matchMedia(
      '(min-width: 900px) and (prefers-reduced-motion: no-preference)',
    )
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number }
      ) => number
      cancelIdleCallback?: (handle: number) => void
    }

    let controller: { destroy: () => void } | null = null
    let loading = false
    let request = 0
    let cancelScheduledStart: (() => void) | null = null

    const cancelStart = () => {
      cancelScheduledStart?.()
      cancelScheduledStart = null
    }

    const stop = () => {
      cancelStart()
      request += 1
      loading = false
      controller?.destroy()
      controller = null
    }

    const start = async () => {
      if (loading || controller) return
      loading = true
      const requestId = ++request
      const animate = media.matches
      const controllerModule = import('@/lib/case-study/controller')
      let motion: { gsap: unknown; ScrollTrigger: unknown } | undefined

      if (animate) {
        try {
          const [{ default: gsap }, { ScrollTrigger }, { CustomEase }] =
            await Promise.all([
              import('gsap'),
              import('gsap/ScrollTrigger'),
              import('gsap/CustomEase'),
            ])

          gsap.registerPlugin(ScrollTrigger, CustomEase)
          CustomEase.create('portfolio-out', '0.16,1,0.3,1')
          motion = { gsap, ScrollTrigger }
        } catch {
          // Motion is optional. Navigation, zoom, and the lightbox must still
          // bind when an animation chunk cannot load.
          motion = undefined
        }
      }

      const { default: CaseStudy } = await controllerModule
      if (requestId !== request || animate !== media.matches) return
      loading = false
      controller = new CaseStudy(root, motion)
    }

    const scheduleStart = () => {
      // Desktop animation setup is visible and starts immediately. On touch
      // layouts the controller is progressive enhancement, so keep it out of
      // hydration and the first paint while retaining a bounded fallback.
      if (media.matches) {
        void start()
        return
      }

      if (idleWindow.requestIdleCallback) {
        const handle = idleWindow.requestIdleCallback(
          () => {
            cancelScheduledStart = null
            void start()
          },
          { timeout: 1_200 }
        )
        cancelScheduledStart = () => idleWindow.cancelIdleCallback?.(handle)
        return
      }

      const handle = window.setTimeout(() => {
        cancelScheduledStart = null
        void start()
      }, 160)
      cancelScheduledStart = () => window.clearTimeout(handle)
    }

    const sync = () => {
      stop()
      scheduleStart()
    }

    sync()
    media.addEventListener('change', sync)

    return () => {
      media.removeEventListener('change', sync)
      stop()
    }
  }, [])

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  )
}

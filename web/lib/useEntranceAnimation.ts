'use client'

import {
  useEffect,
  useLayoutEffect,
  type RefObject,
} from 'react'

import { DUR, EASE, TRAVEL, delayFor } from '@/lib/motion'

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

type EntranceOptions = {
  enabled?: boolean
  index?: number
  after?: number
  observe?: boolean
  clip?: boolean
  duration?: number
}

function clearMotionStyles(element: HTMLElement) {
  element.style.removeProperty('opacity')
  element.style.removeProperty('transform')
  element.style.removeProperty('clip-path')
  element.style.removeProperty('will-change')
}

/**
 * Progressive-enhancement entrance:
 *
 * - server HTML is fully visible;
 * - capable clients animate before their first hydrated paint;
 * - below-fold elements are prepared only after JavaScript is active;
 * - a failed chunk or missing Web Animations API never hides content.
 */
export function useEntranceAnimation<T extends HTMLElement>(
  ref: RefObject<T | null>,
  {
    enabled = true,
    index = 0,
    after = 0,
    observe = false,
    clip = false,
    duration: requestedDuration,
  }: EntranceOptions = {},
) {
  useIsomorphicLayoutEffect(() => {
    if (!enabled) return

    const element = ref.current
    if (!element || typeof element.animate !== 'function') return

    // Native View Transitions own the route snapshot, and a pop owns the
    // whole canvas. Replaying component entrances underneath either creates
    // a second, mostly hidden choreography (rule 9).
    const routeMode = document.documentElement.dataset.routeTransition
    if (routeMode === 'native' || routeMode === 'pop') return

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const canClip = clip && !reduced
    const delay = (after + delayFor(index)) * 1000
    const duration =
      (reduced
        ? DUR.reduced
        : requestedDuration ?? (canClip ? DUR.tell : DUR.base)) * 1000
    const easing = `cubic-bezier(${EASE.out.join(',')})`
    const from: Keyframe = canClip
      ? { opacity: 1, clipPath: 'inset(100% 0 0 0)' }
      : {
          opacity: 0,
          transform: reduced
            ? 'none'
            : `translate3d(0, ${TRAVEL.sm}px, 0)`,
        }
    const to: Keyframe = canClip
      ? { opacity: 1, clipPath: 'inset(0% 0 0 0)' }
      : { opacity: 1, transform: 'none' }

    let animation: Animation | null = null
    let observer: IntersectionObserver | null = null
    let disposed = false

    const finish = () => {
      if (disposed) return
      animation?.cancel()
      animation = null
      clearMotionStyles(element)
    }

    const play = () => {
      observer?.disconnect()
      observer = null
      element.style.willChange = canClip
        ? 'clip-path'
        : reduced
          ? 'opacity'
          : 'transform, opacity'
      animation = element.animate([from, to], {
        duration,
        delay,
        easing,
        fill: 'both',
      })
      void animation.finished.then(finish).catch(() => {})
    }

    const belowFold =
      observe &&
      element.getBoundingClientRect().top > window.innerHeight * 0.92

    if (belowFold && 'IntersectionObserver' in window) {
      element.style.opacity = String(from.opacity ?? 1)
      if (from.transform) element.style.transform = String(from.transform)
      if (from.clipPath) element.style.clipPath = String(from.clipPath)

      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) play()
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
      observer.observe(element)
    } else {
      play()
    }

    return () => {
      disposed = true
      observer?.disconnect()
      animation?.cancel()
      clearMotionStyles(element)
    }
  }, [after, clip, enabled, index, observe, ref, requestedDuration])
}

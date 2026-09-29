'use client'

import Link from 'next/link'
import { MotionConfig } from 'motion/react'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from 'react'

import { directionBetween } from '@/lib/route-axis'

type TransitionDocument = Document & {
  startViewTransition?: (
    update: () => Promise<void> | void
  ) => NativeViewTransition
}

type NativeViewTransition = {
  finished: Promise<void>
  skipTransition?: () => void
}

type PendingNavigation = {
  resolve: () => void
  timer: number
}

function isReaderPath(pathname: string) {
  return /^\/works\/[^/]+\/?$/.test(pathname)
}

/**
 * The axis is a phone affordance, so it is gated on the phone.
 *
 * Not timidity: at 1440px the site is a column and a canvas, the whole of
 * the navigation is visible at once, and there is nothing for a direction to
 * disambiguate. The bar at the foot of a phone IS the spatial model, which
 * is what makes travelling along it mean something. slide.py also asserts
 * that a plain link does not slide at desktop widths, and that assertion is
 * still correct.
 *
 * An explicit `direction` — prev/next — is never gated. It applies at every
 * width, exactly as before.
 */
function axisApplies() {
  return window.matchMedia('(max-width: 679px)').matches
}

/**
 * Forward and back along the project sequence. Only prev/next sets this, so
 * its absence means "no directional opinion" and the ordinary route
 * animation runs. globals.css reads it off <html>.
 */
export type RouteDirection = 'forward' | 'back'

function clearRouteMetadata(mode?: 'native' | 'fallback' | 'pop') {
  if (
    mode &&
    document.documentElement.dataset.routeTransition !== mode
  ) {
    return
  }
  delete document.documentElement.dataset.routeTransition
  delete document.documentElement.dataset.routeTransitionKind
  delete document.documentElement.dataset.routeDirection
}

const RouteTransitionContext = createContext<
  | ((href: string, direction?: RouteDirection, restoreScroll?: number) => void)
  | null
>(null)

/**
 * Coordinates Next client navigation with the native View Transitions API.
 * The callback resolves after the destination pathname commits, so the
 * browser captures the real destination DOM rather than the old page twice.
 */
export function RouteTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const pending = useRef<PendingNavigation | null>(null)
  const activeNative = useRef<NativeViewTransition | null>(null)
  // popstate fires before React has re-rendered, so the handler can read the
  // route we are leaving only from a ref, not from the render's `pathname`.
  const here = useRef(pathname)
  const popped = useRef<RouteDirection | null>(null)
  const restore = useRef<number | null>(null)

  useEffect(() => {
    here.current = pathname
  }, [pathname])

  /**
   * The system back gesture, which was the loudest inconsistency left on a
   * phone: pressing a link ran a full transition, and swiping in from the
   * edge — how people actually go back — swapped the page instantly.
   *
   * This is NOT the View Transitions path. By the time popstate fires the
   * history entry has already changed, so there is nothing left to snapshot
   * the old page from, and wrestling the App Router for its own history is
   * a known way to break back and forward outright. What a pop gets instead
   * is a one-sided entrance: the arriving page slides in from the side it
   * came from. Not a true push and pop, and honestly less than a click
   * gets — but it is the same direction, the same distance and the same
   * easing, so the two stop contradicting each other.
   *
   * The animation is a CSS class rather than WAAPI because --travel-page is
   * `22vw` at this width: a custom property hands JavaScript back the token,
   * not a resolved length, and the stylesheet is where a viewport unit can
   * still mean something.
   */
  useEffect(() => {
    const onPop = () => {
      const from = here.current
      const to = window.location.pathname
      if (from === to) return

      popped.current = axisApplies()
        ? directionBetween(from, to) ?? null
        : null

      // 'pop' rather than 'fallback': both mean "no native transition", but
      // this one owns the whole entrance, and component-level entrances must
      // not replay underneath it (rule 9, one coordinated arrival).
      document.documentElement.dataset.routeTransition = 'pop'
      document.documentElement.dataset.routeTransitionKind =
        isReaderPath(from) || isReaderPath(to) ? 'reader' : 'page'
      if (popped.current) {
        document.documentElement.dataset.routeDirection = popped.current
      } else {
        delete document.documentElement.dataset.routeDirection
      }
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const finishPending = useCallback(() => {
    if (!pending.current) return

    // Where the destination opens, decided BEFORE the promise resolves,
    // because that is what the browser waits on before snapshotting it.
    // Doing it afterwards would capture the wrong offset, slide that in,
    // and then jump — worse than not doing it at all.
    //
    // The default is the top, and that is no longer something Next does for
    // us: 16 stopped resetting the offset on a client navigation, so
    // pressing "next" at the foot of a 33,000px case study opened the next
    // one 5,228px in, with the progress bar reading 100% and the rail
    // showing chapter 04 — all three correct, for a reader who had never
    // asked to be there. A tab that remembers an offset passes one instead.
    //
    // Only click navigations reach here; `pending` is never set for a pop,
    // so back and forward keep the browser's own restoration.
    //
    // `instant` because html carries scroll-behavior: smooth, and a
    // 12,000px smooth scroll underneath a static snapshot is a second of
    // nothing followed by a lurch.
    const y = restore.current
    restore.current = null
    window.scrollTo({ top: y ?? 0, behavior: 'instant' })

    window.clearTimeout(pending.current.timer)
    pending.current.resolve()
    pending.current = null
  }, [])

  useEffect(() => {
    finishPending()

    const mode = document.documentElement.dataset.routeTransition

    if (mode === 'pop') {
      const direction = popped.current
      popped.current = null
      const canvas = document.querySelector<HTMLElement>('main.canvas')
      if (canvas) {
        // The canvas outlives the route, so the animation has to be
        // restarted rather than merely re-declared. Removing the attribute
        // and reading a layout property forces the style recalculation that
        // makes the second pop animate at all.
        delete canvas.dataset.pop
        void canvas.offsetWidth
        if (direction) canvas.dataset.pop = direction
      }
      const frame = window.requestAnimationFrame(() =>
        clearRouteMetadata('pop')
      )
      return () => window.cancelAnimationFrame(frame)
    }

    // Child layout effects have already claimed the fallback route metadata.
    // Keep it through the first destination paint, then release it so an
    // unrelated state update cannot replay route-only entrances.
    if (mode !== 'fallback') return
    const frame = window.requestAnimationFrame(() =>
      clearRouteMetadata('fallback')
    )
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, finishPending])

  const cancelNative = useCallback(() => {
    const navigation = pending.current
    pending.current = null
    if (navigation) {
      window.clearTimeout(navigation.timer)
      navigation.resolve()
    }

    const transition = activeNative.current
    activeNative.current = null
    transition?.skipTransition?.()
  }, [])

  useEffect(
    () => () => {
      cancelNative()
      clearRouteMetadata()
    },
    [cancelNative]
  )

  const navigate = useCallback(
    (href: string, direction?: RouteDirection, restoreScroll?: number) => {
      const target = new URL(href, window.location.href)
      restore.current = restoreScroll ?? null
      const transitionDocument = document as TransitionDocument
      // Reduced motion is handled in CSS, not by refusing to transition:
      // globals.css snaps every ::view-transition-group to 1ms (so nothing
      // travels) and cross-fades old against new. Skipping the transition
      // outright left the reader with no signal at all that the page had
      // changed, and made that whole block of CSS unreachable.
      const canTransition =
        typeof transitionDocument.startViewTransition === 'function' &&
        target.pathname !== pathname

      if (target.pathname === pathname) {
        restore.current = null
        router.push(href)
        return
      }

      // A newer navigation always wins. Native transitions can be skipped;
      // fallback entrances are component-owned and naturally unmount.
      cancelNative()
      document.documentElement.dataset.routeTransitionKind =
        isReaderPath(pathname) || isReaderPath(target.pathname)
          ? 'reader'
          : 'page'

      // An explicit direction is prev/next and always wins. Failing that,
      // the phone reads one off the site's own order: Works, About, Contact
      // sideways, and a project one step deeper than the index it came from.
      const resolved =
        direction ??
        (axisApplies()
          ? directionBetween(pathname, target.pathname)
          : undefined)

      // Set before startViewTransition, so the OLD snapshot is captured with
      // the attribute already applied. Deleted rather than left when there is
      // no direction, or an ordinary link after a prev/next would inherit the
      // last slide.
      if (resolved) {
        document.documentElement.dataset.routeDirection = resolved
      } else {
        delete document.documentElement.dataset.routeDirection
      }

      if (!canTransition) {
        document.documentElement.dataset.routeTransition = 'fallback'
        const y = restore.current
        restore.current = null
        router.push(href)
        // No snapshot to get ahead of here, so this lands on the next frame.
        window.requestAnimationFrame(() =>
          window.scrollTo({ top: y ?? 0, behavior: 'instant' })
        )
        return
      }

      document.documentElement.dataset.routeTransition = 'native'
      const transition = transitionDocument.startViewTransition?.(() =>
        new Promise<void>((resolve) => {
          const timer = window.setTimeout(() => {
            if (pending.current?.resolve === resolve) pending.current = null
            resolve()
          }, 1800)
          pending.current = { resolve, timer }
          router.push(href)
        })
      )
      if (!transition) {
        document.documentElement.dataset.routeTransition = 'fallback'
        router.push(href)
        return
      }

      activeNative.current = transition
      void transition.finished
        .finally(() => {
          if (activeNative.current !== transition) return
          activeNative.current = null
          clearRouteMetadata('native')
        })
        .catch(() => {})
    },
    [cancelNative, pathname, router]
  )

  return (
    <MotionConfig reducedMotion="user">
      <RouteTransitionContext.Provider value={navigate}>
        {children}
      </RouteTransitionContext.Provider>
    </MotionConfig>
  )
}

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string
  /** Prev/next only. Everything else navigates without a directional opinion. */
  direction?: RouteDirection
  /** Tab bar only: the offset the destination was left at. */
  restoreScroll?: number
}

/** A normal Next link with progressive enhancement for route transitions. */
export const TransitionLink = forwardRef<
  HTMLAnchorElement,
  TransitionLinkProps
>(function TransitionLink(
  { href, onClick, target, direction, restoreScroll, ...props },
  ref
) {
  const navigate = useContext(RouteTransitionContext)

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      !navigate ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === '_blank'
    ) {
      return
    }

    event.preventDefault()
    navigate(href, direction, restoreScroll)
  }

  return (
    <Link
      {...props}
      ref={ref}
      href={href}
      target={target}
      onClick={handleClick}
    />
  )
})

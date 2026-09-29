'use client'

// ─────────────────────────────────────────────────────────────────────────
// One fixed layer, one spring, transform only.
//
// The state is resolved CENTRALLY, from one pointerover listener, rather
// than by each component wiring its own enter/leave handlers. Two reasons,
// both of which showed up as the cursor behaving differently depending on
// what you happened to hover:
//
//   1. A handler has to be remembered. Roughly a dozen links never got one
//      (the wordmark, the back links, Download CV, Show credential, the
//      case-study footer, the mailto), so the disc stayed an 8px dot on
//      them while the nav pills grew. Central resolution cannot forget.
//   2. Some controls are not React's to bind. The lightbox close button and
//      the figure zoom toolbar are built by lib/case-study/controller.ts at
//      runtime, so no amount of bind() calls would ever have covered them.
//
// `bind()` still exists and still wins: it writes `data-cursor` on the
// element, and the resolver reads that before falling back to "this is
// clickable, so grow". Explicit intent beats the default, and the default
// covers everything nobody thought about.
//
// Two hard guards:
//   1. no hovering pointer anywhere → the provider renders nothing at all
//   2. the native cursor is hidden ONLY after the layer paints its first
//      frame, so a failed chunk never leaves an invisible pointer
//
// prefers-reduced-motion is NOT a third guard. It stiffens the spring so
// the disc stops trailing, and that is all: the label is what the cursor
// is FOR, and hiding it turns a working affordance into a dead dot.
// MOTION-SYSTEM rule 8: reduced motion replaces travel, it never removes
// the signal.
// ─────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'

import { useFinePointer } from '@/lib/useFinePointer'
import styles from './Cursor.module.css'

export type CursorState = 'default' | 'soft' | 'view' | 'hide'

/**
 * `data-cursor` is read back off the DOM, where anything can appear: a
 * hand-written attribute, a typo, or a value left over from a state that no
 * longer exists. An unrecognised one would set `data-state` to something no
 * CSS rule matches, leaving the disc at its base size with nothing logged,
 * so unknown values fall through to the ordinary clickable rule instead.
 */
const STATES = new Set<string>([
  'default',
  'soft',
  'view',
  'hide',
] satisfies CursorState[])

/**
 * Anything you click. `:disabled` is excluded because a dead control should
 * not offer the affordance of a live one, and `[tabindex="-1"]` because it
 * is focusable by script, not by a person.
 */
const CLICKABLE = [
  'a[href]',
  'button:not(:disabled)',
  'select:not(:disabled)',
  'summary',
  'label[for]',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Text entry hides the disc instead of growing it. A translucent circle
 * floating over the field you are typing into is the wrong affordance, and
 * globals.css hands the native caret back for exactly these, so the two
 * never stack.
 */
const TEXT_ENTRY = [
  'textarea',
  'input:not([type])',
  'input[type="text"]',
  'input[type="email"]',
  'input[type="search"]',
  'input[type="url"]',
  'input[type="tel"]',
  'input[type="password"]',
  'input[type="number"]',
  '[contenteditable="true"]',
].join(',')

interface CursorApi {
  set: (s: CursorState, label?: string) => void
  /**
   * Spread onto an element to override the default for it and everything
   * inside it. The label is optional because only the `view` disc shows
   * one; every `bind('soft')` call passes nothing and always has.
   */
  bind: (
    s: CursorState,
    label?: string
  ) => { 'data-cursor': CursorState; 'data-cursor-label'?: string }
}

const noop: CursorApi = {
  set: () => {},
  bind: (s) => ({ 'data-cursor': s }),
}

const Ctx = createContext<CursorApi>(noop)

export const useCursor = () => useContext(Ctx)

export function CursorProvider({ children }: { children: ReactNode }) {
  const fine = useFinePointer()
  const reduced = useReducedMotion()
  const [{ state, label }, setCursor] = useState<{
    state: CursorState
    label: string
  }>({ state: 'default', label: 'View project' })
  const pathname = usePathname()

  // The label is kept on leave rather than reset. The disc is still
  // shrinking at that point, and swapping the text under it mid-shrink is
  // the one thing more distracting than the pop this replaced.
  // Where the pointer last was, so a navigation that does not move it can
  // still work out what it is now sitting on.
  const point = useRef<{ x: number; y: number } | null>(null)

  const set = useCallback(
    (s: CursorState, next?: string) =>
      setCursor((prev) =>
        prev.state === s && (next === undefined || prev.label === next)
          ? prev
          : { state: s, label: next ?? prev.label }
      ),
    []
  )

  const bind = useCallback(
    (s: CursorState, next?: string) => ({
      'data-cursor': s,
      ...(next ? { 'data-cursor-label': next } : {}),
    }),
    []
  )

  /** What the cursor should be for whatever is under `target`. */
  const resolve = useCallback(
    (target: Element | null) => {
      if (!target) return set('default')

      const owned = target.closest<HTMLElement>('[data-cursor]')
      const claimed = owned?.dataset.cursor
      if (claimed && STATES.has(claimed)) {
        return set(claimed as CursorState, owned?.dataset.cursorLabel)
      }
      if (target.closest(TEXT_ENTRY)) return set('hide')
      if (target.closest(CLICKABLE)) return set('soft')
      set('default')
    },
    [set]
  )

  // The resolver. `pointerover` fires on every element boundary the pointer
  // crosses and bubbles, so one listener sees the whole document, including
  // anything mounted after this effect ran.
  useEffect(() => {
    if (!fine) return

    const onOver = (e: PointerEvent) => {
      point.current = { x: e.clientX, y: e.clientY }
      resolve(e.target instanceof Element ? e.target : null)
    }
    const onMove = (e: PointerEvent) => {
      point.current = { x: e.clientX, y: e.clientY }
    }
    // relatedTarget is null when the pointer leaves the window entirely;
    // no pointerover follows, so without this the disc would stay grown.
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        point.current = null
        set('default')
      }
    }

    // While a view transition is live its snapshot layer sits over the
    // page, so `elementFromPoint` answers <html> for every coordinate and
    // the state cannot be worked out. RouteTransition clears
    // `data-route-transition` off <html> when the transition finishes
    // (fallback path included), which is the moment hit testing is honest
    // again and the pointer's real target can be read.
    const onRouteSettled = new MutationObserver(() => {
      if (document.documentElement.dataset.routeTransition !== undefined) return
      const p = point.current
      if (p) resolve(document.elementFromPoint(p.x, p.y))
    })
    onRouteSettled.observe(document.documentElement, {
      attributeFilter: ['data-route-transition'],
    })

    const refresh = () => { const p = point.current; if(p) resolve(document.elementFromPoint(p.x,p.y)) }
    window.addEventListener('cursor-surface-change', refresh)
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    return () => {
      onRouteSettled.disconnect()
      window.removeEventListener('cursor-surface-change', refresh)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    }
  }, [fine, resolve, set])

  // A route change is committed by a click, and the pointer never physically
  // leaves the link, because the DOM is swapped out from under it. No
  // pointerover follows, so the state has to be worked out again by hand.
  //
  // Re-resolved from the last known point rather than reset to `default`:
  // clicking a nav pill leaves the pointer on that same pill in the new
  // page, and blanking it would shrink the disc to a dot on a live control.
  //
  // This covers navigations that never start a transition. When one does
  // start it is still running at this point, and the observer above does the
  // real work once the snapshot layer is gone.
  useEffect(() => {
    const p = point.current
    resolve(p ? document.elementFromPoint(p.x, p.y) : null)
  }, [pathname, resolve])

  const api = useMemo<CursorApi>(() => ({ set, bind }), [set, bind])

  return (
    <Ctx.Provider value={api}>
      {children}
      {fine && <CursorLayer state={state} label={label} reduced={!!reduced} />}
    </Ctx.Provider>
  )
}

function CursorLayer({
  state,
  label,
  reduced,
}: {
  state: CursorState
  label: string
  reduced: boolean
}) {
  const [pressed, setPressed] = useState(false)
  const [host, setHost] = useState<Element | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    let frame = 0
    const sync = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const modal = Array.from(document.querySelectorAll('dialog[open]')).filter(e => e.matches(':modal')).at(-1)
        setHost(modal ?? document.fullscreenElement ?? document.body)
        window.dispatchEvent(new Event('cursor-surface-change'))
      })
    }
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {subtree:true, attributes:true, attributeFilter:['open']})
    document.addEventListener('fullscreenchange',sync)
    sync()
    return () => { cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('fullscreenchange',sync);delete document.body.dataset.cursorReady }
  }, [])
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)

  // Stiff on purpose: the dot should feel attached, not trailing. The
  // loose spring belongs to the spec-sheet thumbnail, not here.
  const config = reduced
    ? { stiffness: 1000, damping: 100, mass: 0.1 }
    : { stiffness: 500, damping: 40, mass: 0.35 }
  const sx = useSpring(x, config)
  const sy = useSpring(y, config)
  const transform = useMotionTemplate`translate3d(${sx}px, ${sy}px, 0)`

  useEffect(() => {
    let painted = false
    const move = (e: PointerEvent) => {
      if(e.pointerType === 'touch') { setVisible(false); delete document.body.dataset.cursorReady; return }

      // Some immersive surfaces deliberately opt out of the portfolio disc.
      // Hand the native cursor back on those surfaces instead of hiding both
      // cursors at once. Text entry follows the same rule so its caret is
      // available even when it appears inside a modal or fullscreen surface.
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest('[data-cursor="hide"]') || target?.closest(TEXT_ENTRY)) {
        setVisible(false)
        delete document.body.dataset.cursorReady
        return
      }

      setVisible(true)
      document.body.dataset.cursorReady = 'true'
      x.set(e.clientX)
      y.set(e.clientY)
      if (!painted) {
        painted = true
        // Only now is it safe to hide the native cursor.
        document.body.dataset.cursorReady = 'true'
      }
    }
    const leave = () => { setVisible(false); delete document.body.dataset.cursorReady }
    const out = (e: PointerEvent) => { if(!e.relatedTarget || (e.relatedTarget instanceof HTMLIFrameElement))leave() }
    window.addEventListener('blur',leave)
    window.addEventListener('pointerout',out)
    window.addEventListener('pointerdown',move,{passive:true})
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown',move)
      window.removeEventListener('blur',leave)
      window.removeEventListener('pointerout',out)
      delete document.body.dataset.cursorReady
    }
  }, [x, y])

  // A modal can open under a stationary pointer, so there may be no new
  // pointermove event to return the native cursor. The resolved state closes
  // that gap as soon as the new surface is mounted and hit-tested.
  useEffect(() => {
    if (state !== 'hide') return
    delete document.body.dataset.cursorReady
  }, [state])

  useEffect(() => {
    const down = (event: PointerEvent) => {
      if (event.button === 0) setPressed(true)
    }
    const up = () => setPressed(false)
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    window.addEventListener('pointercancel', up, { passive: true })
    window.addEventListener('blur', up)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('blur', up)
    }
  }, [])

  return host ? createPortal(
    <motion.div
      data-circle-cursor="true" className={styles.cursor}
      data-state={state}
      data-pressed={pressed}
      style={{ transform, visibility: visible ? 'visible' : 'hidden' }}
      aria-hidden
    >
      {/* One disc, not a dot and a halo. It is the same circle at two
          sizes, so the `view` state can grow it instead of cross-fading
          two elements that never meet in between. */}
      <span className={styles.disc}>
        <span className={styles.label}>{label}</span>
      </span>
    </motion.div>, host
  ) : null
}

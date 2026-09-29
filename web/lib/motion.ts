// ─────────────────────────────────────────────────────────────────────────
// The JS half of the motion system. The CSS half lives in globals.css.
// One source per value. Never inline a duration or a spring.
// See MOTION-SYSTEM.md §3.
// ─────────────────────────────────────────────────────────────────────────

/** Seconds, because Motion works in seconds and CSS works in ms. */
export const DUR = {
  tap: 0.09,
  reduced: 0.12,
  quick: 0.15,
  base: 0.26,
  move: 0.34,
  page: 0.42,
  tell: 0.62,
  /** exits are 60% of their enter */
  baseOut: 0.156,
  moveOut: 0.204,
} as const

export const EASE = {
  out: [0.16, 1, 0.3, 1],
  in: [0.7, 0, 0.84, 0],
  inOut: [0.77, 0, 0.175, 1],
  move: [0.1, 0.9, 0.2, 1],
} as const

/** Deterministic shared-layout timing for large on-screen morphs. */
export const LAYOUT = {
  morph: { type: 'tween', duration: DUR.move, ease: EASE.inOut },
} as const

/** Metro cadence. 60–80ms is what made the old grid feel floaty. */
export const STAGGER = 0.034
/** Rule 6: past this, items share the last delay rather than queueing. */
export const STAGGER_MAX = 8

export const SPRING = {
  /** cursor / pointer tracking; must feel attached */
  tight: { type: 'spring', stiffness: 500, damping: 40, mass: 0.35 },
  /** layout morphs, grid↔list; snappy, no bounce */
  snap: { type: 'spring', stiffness: 420, damping: 38, mass: 0.8 },
  /** the hover thumbnail; deliberately lagging */
  trail: { type: 'spring', stiffness: 140, damping: 20, mass: 0.6 },
} as const

export const TRAVEL = { xs: 6, sm: 14, md: 28, lg: 64 } as const

/** Stagger delay for item `i`, capped per rule 6. */
export const delayFor = (i: number) => Math.min(i, STAGGER_MAX) * STAGGER

/** Standard element entrance. */
export const enter = (i = 0) => ({
  initial: { opacity: 0, y: TRAVEL.sm },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DUR.base, ease: EASE.out, delay: delayFor(i) },
})

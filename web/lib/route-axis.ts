// ─────────────────────────────────────────────────────────────────────────
// The site's spatial order, as coordinates.
//
// Direction used to be something only prev/next had an opinion about, so
// every other move — Works to About, a project opening, a project closing —
// travelled the same way in both directions and told the reader nothing.
// On a phone, where the tab bar is the only orientation there is, that is
// the difference between a place and a slideshow.
//
// Two axes, compared in order:
//
//     tab      Works 0 ── Playground 1 ── About 2 ── Contact 3
//     depth    /works 0 ── /works/[slug] 1
//
// The tab wins when it differs, because the bar is the spatial model the
// reader is actually holding: leaving a case study for About is sideways,
// not upward, however deep the case study was.
// ─────────────────────────────────────────────────────────────────────────

import type { RouteDirection } from '@/components/navigation/RouteTransition'

let TABS = ['/works', '/playground', '/about', '/contact']
export function configureRouteOrder(paths:string[]){TABS=paths.filter(p=>p.startsWith('/'))}

/**
 * `[tab, depth]`. A tab of -1 means "not on the map" — a 404, or anything
 * added later that has not been given a place — and the caller reads that
 * as "no opinion" rather than guessing.
 */
export function routeCoords(pathname: string): [number, number] {
  // `/` redirects to /works, so it is the same place as far as travel goes.
  if (pathname === '/') return [0, 0]

  const tab = TABS.findIndex(
    (t) => pathname === t || pathname.startsWith(`${t}/`)
  )
  if (tab < 0) return [-1, 0]

  const rest = pathname.slice(TABS[tab].length).split('/').filter(Boolean)
  return [tab, rest.length]
}

/**
 * Which way the page should travel, or `undefined` when the two routes sit
 * in the same place.
 *
 * `undefined` is load-bearing rather than a shrug: two case studies are the
 * same [tab, depth], so this declines, and the explicit `direction` that
 * <ProjectNav /> already passes stays in charge. The two mechanisms compose
 * instead of fighting over the attribute.
 */
export function directionBetween(
  from: string,
  to: string
): RouteDirection | undefined {
  const a = routeCoords(from)
  const b = routeCoords(to)

  if (a[0] < 0 || b[0] < 0) return undefined
  if (a[0] !== b[0]) return b[0] > a[0] ? 'forward' : 'back'
  if (a[1] !== b[1]) return b[1] > a[1] ? 'forward' : 'back'
  return undefined
}

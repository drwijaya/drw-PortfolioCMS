// ─────────────────────────────────────────────────────────────────────────
// Where each tab was when you left it.
//
// A bottom tab bar that always lands on a section's index is a tab bar that
// punishes you for looking something up. Read half a case study, check a
// date on /about, come back, and you are at the top of the index with your
// place gone. Native tab bars have solved this for fifteen years: a tab
// remembers, and tapping the tab you are already on is what pops you out.
//
// Module state, not sessionStorage. The mark is only meaningful for as long
// as the page has been open — being dropped into the middle of a project you
// were reading before a reload is not continuity, it is confusion — and a
// plain object cannot throw in a privacy mode or blow a quota.
// ─────────────────────────────────────────────────────────────────────────

export type TabKey = string

export const TAB_ROOT: Record<TabKey, string> = {
  works: '/works',
  playground: '/playground',
  about: '/about',
  contact: '/contact',
}

export interface Mark {
  path: string
  y: number
}

/** `/` redirects to /works, so it is the same place. */
export function tabOf(pathname: string): TabKey | null {
  if (pathname === '/') return 'works'
  for (const key of Object.keys(TAB_ROOT) as TabKey[]) {
    const root = TAB_ROOT[key]
    if (pathname === root || pathname.startsWith(`${root}/`)) return key
  }
  return null
}

const marks = new Map<TabKey, Mark>()
const markListeners = new Set<() => void>()
let markVersion = 0

export function subscribeMarks(listener: () => void) {
  markListeners.add(listener)
  return () => {
    markListeners.delete(listener)
  }
}

export function getMarksVersion() {
  return markVersion
}

/** Live scroll offsets, keyed by path. Written on every scroll frame, which
 *  is why this is a Map and not storage: it is far too hot for either. */
const offsets = new Map<string, number>()

export function noteScroll(pathname: string, y: number) {
  offsets.set(pathname, y)
}

/**
 * Called when a route is left. The mark is the path plus wherever the reader
 * had got to in it — read from `offsets` rather than from `window`, because
 * by the time anything notices the route changed the browser has already
 * reset the scroll position for the new one.
 */
export function markLeaving(pathname: string) {
  const tab = tabOf(pathname)
  if (!tab) return
  const next = { path: pathname, y: offsets.get(pathname) ?? 0 }
  const current = marks.get(tab)
  if (current?.path === next.path && current.y === next.y) return

  marks.set(tab, next)
  markVersion += 1
  markListeners.forEach((listener) => listener())
}

/** Where a tab should go. Its root until it has been somewhere. */
export function markFor(tab: TabKey): Mark {
  return marks.get(tab) ?? { path: TAB_ROOT[tab], y: 0 }
}

export function configureTabs(items:{id:string;href:string}[]) { for(const item of items) if(item.href.startsWith('/')) TAB_ROOT[item.id]=item.href }

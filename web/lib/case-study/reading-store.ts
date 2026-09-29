// ─────────────────────────────────────────────────────────────────────────
// Reading state: the one channel between the scroll controller and the
// sidebar. They render in different React trees (the sidebar is a parallel
// route slot), so neither can pass props to the other.
//
// Two channels on purpose:
//
//   activeId  changes ~10 times per document → a React render is fair.
//   progress  changes every animation frame  → subscribers write to the DOM
//             through refs, and React never hears about it.
//
// The state is OWNED by one case study at a time, and every read names the
// document it is asking on behalf of. Prev/next navigates straight from one
// case study to the next, and React renders the incoming sidebar before it
// runs the outgoing controller's cleanup: the new rail reads this store one
// phase before the old one resets it. Two of the three case studies share
// section ids ("problem", "outcome"), so an unguarded read lands the reader
// on a chapter they have not reached. Guarding the read rather than racing
// the reset is what makes that impossible instead of unlikely.
// ─────────────────────────────────────────────────────────────────────────

type Listener = () => void
type ProgressListener = (value: number) => void

let owner: string | null = null
let activeId: string | null = null
let progress = 0

const activeListeners = new Set<Listener>()
const progressListeners = new Set<ProgressListener>()

/** The first write from a new document takes the state with it. */
function adopt(slug: string) {
  if (owner === slug) return
  owner = slug
  activeId = null
  progress = 0
}

export const reading = {
  /** The section under the reading line, or null if the state is not ours. */
  getActive(forSlug: string): string | null {
    return owner === forSlug ? activeId : null
  },

  /** Server render has no scroll position, so chapter one is current. */
  getServerActive(): string | null {
    return null
  },

  setActive(slug: string, id: string | null) {
    adopt(slug)
    if (id === activeId) return
    activeId = id
    activeListeners.forEach((fn) => fn())
  },

  setProgress(slug: string, value: number) {
    adopt(slug)
    if (value === progress) return
    progress = value
    progressListeners.forEach((fn) => fn(value))
  },

  subscribeActive(fn: Listener) {
    activeListeners.add(fn)
    return () => {
      activeListeners.delete(fn)
    }
  },

  /** Fires immediately, with 0 unless the stored value belongs to `forSlug`. */
  subscribeProgress(forSlug: string, fn: ProgressListener) {
    progressListeners.add(fn)
    fn(owner === forSlug ? progress : 0)
    return () => {
      progressListeners.delete(fn)
    }
  },

  /** Called when a case study unmounts, so the next one starts clean. */
  reset() {
    owner = null
    activeId = null
    progress = 0
    activeListeners.forEach((fn) => fn())
    progressListeners.forEach((fn) => fn(0))
  },
}

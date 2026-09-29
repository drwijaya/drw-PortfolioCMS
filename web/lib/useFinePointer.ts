'use client'

import { useEffect, useState } from 'react'

/**
 * True when SOME input on this machine can hover with a precise pointer.
 *
 * `any-hover`/`any-pointer` rather than `hover`/`pointer`: a touchscreen
 * laptop reports its touch panel as the PRIMARY pointer, so the plain
 * queries answer "coarse, cannot hover" for a machine sitting under a
 * trackpad. That silently removed every pointer-only feature on exactly
 * the kind of laptop most likely to have one.
 *
 * Starts false so the server render and the first client render agree.
 * Pointer-only features mount after hydration, never during it.
 */
export function useFinePointer() {
  const [fine, setFine] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(any-hover: hover) and (any-pointer: fine)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return fine
}

'use client'

import { useRef, type ReactNode } from 'react'

import { useEntranceAnimation } from '@/lib/useEntranceAnimation'

/**
 * The Metro cascade, tier 3 of the Continuum system. Everything that is
 * genuinely new on a page arrives in reading order at 34ms intervals.
 *
 * Reduced motion keeps the reveal but drops the travel (rule 8): feedback
 * survives, movement does not.
 */
export function Cascade({
  children,
  index = 0,
  /** hold off until a travelling shared element has mostly landed */
  after = 0,
  className,
}: {
  children: ReactNode
  index?: number
  after?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEntranceAnimation(ref, { after, index })

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

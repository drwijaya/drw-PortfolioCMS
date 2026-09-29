'use client'

import { useRef, type ReactNode } from 'react'

import { useEntranceAnimation } from '@/lib/useEntranceAnimation'

interface Props {
  children: ReactNode
  /** Metro cadence: 34ms apart, capped so late items don't crawl in. */
  index?: number
  /** wipe up from the bottom instead of fading */
  clip?: boolean
  className?: string
  /** Preserve list semantics when revealing direct children of an ol/ul. */
  as?: 'div' | 'li'
}

export function Reveal({
  children,
  index = 0,
  clip = false,
  className,
  as = 'div',
}: Props) {
  const ref = useRef<HTMLElement | null>(null)
  useEntranceAnimation(ref, { clip, index, observe: true })
  const setRef = (node: HTMLElement | null) => {
    ref.current = node
  }

  if (as === 'li') {
    return (
      <li ref={setRef} className={className}>
        {children}
      </li>
    )
  }

  return (
    <div ref={setRef} className={className}>
      {children}
    </div>
  )
}

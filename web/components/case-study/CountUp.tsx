'use client'

import { useEffect, useRef } from 'react'

interface Props {
  count: number
  className?: string
  decimals?: number
  prefix?: string
  suffix?: string
}

/**
 * Metrics are evidence, so the truthful value must exist in the server HTML
 * and cannot depend on hydration or an IntersectionObserver firing.
 */
export function CountUp({ count, className, decimals = 0, prefix = '', suffix = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const label = `${prefix}${count.toFixed(decimals)}${suffix}`
  useEffect(() => {
    const element = ref.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!element || motion.matches) return
    let frame = 0
    const finish = () => { cancelAnimationFrame(frame); element.textContent = label }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / 900)
        element.textContent = `${prefix}${(count * (1 - (1 - progress) ** 3)).toFixed(decimals)}${suffix}`
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    observer.observe(element)
    motion.addEventListener('change', finish)
    window.addEventListener('beforeprint', finish)
    return () => { observer.disconnect(); finish(); motion.removeEventListener('change', finish); window.removeEventListener('beforeprint', finish) }
  }, [count, decimals, prefix, suffix, label])
  return (
    <span ref={ref} className={className} aria-label={label}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}

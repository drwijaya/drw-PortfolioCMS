'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
export type TextSpeed = 'normal' | 'fast' | 'instant'

export function useTypewriter(text: string, speed: TextSpeed, paused: boolean, initiallyComplete: boolean, onTick: () => void) {
  const characters = useMemo(() => typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), s => s.segment)
    : Array.from(text), [text])
  const [count, setCount] = useState(initiallyComplete ? characters.length : 0)
  const cursor = useRef(initiallyComplete ? characters.length : 0)
  const readyAt = useRef(initiallyComplete ? 0 : Infinity)
  const tick = useRef(onTick)
  useEffect(() => { tick.current = onTick }, [onTick])
  const complete = useCallback(() => {
    cursor.current = characters.length
    readyAt.current = performance.now()
    setCount(characters.length)
  }, [characters.length])
  useEffect(() => {
    if (speed !== 'instant') return
    const id = requestAnimationFrame(complete)
    return () => cancelAnimationFrame(id)
  }, [speed, complete])
  useEffect(() => {
    if (paused || speed === 'instant' || cursor.current >= characters.length) return
    let timer: ReturnType<typeof setTimeout>
    const next = () => {
      if (cursor.current >= characters.length) return
      const index = ++cursor.current
      setCount(index)
      if (/[^\s.,!?…]/u.test(characters[index - 1]) && index % 2 === 0) tick.current()
      if (index >= characters.length) { readyAt.current = performance.now(); return }
      const character = characters[index - 1]
      const delay = /[.!?…]/.test(character) ? 250 : /[,;:]/.test(character) ? 120 : character === '\n' ? 180 : speed === 'fast' ? 16 : 32
      timer = setTimeout(next, delay)
    }
    timer = setTimeout(next, cursor.current === 0 ? 260 : 32)
    return () => clearTimeout(timer)
  }, [characters, paused, speed])
  return { characters, count, ready: count >= characters.length, complete, canAdvance: () => performance.now() - readyAt.current >= 250 }
}

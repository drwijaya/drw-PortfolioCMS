'use client'

import { useEffect, useRef } from 'react'
import { drawCloud, drawSea } from '@/lib/off-the-clock/pixel-scene'
import { light } from '@/lib/off-the-clock/palette'
import type { SceneClock } from '@/lib/off-the-clock/scene-clock'
import styles from './IslandIntro.module.css'

export function TitleScene({ clock, paused }: { clock: SceneClock; paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let visible = false, last = performance.now(), timer: ReturnType<typeof setTimeout> | undefined
    const draw = () => {
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = light.paper; ctx.fillRect(0, 0, 640, 440)
      drawCloud(ctx, light, 60, 100, 75, clock.elapsed)
      drawCloud(ctx, light, 458, 62, 90, clock.elapsed + 3400)
      drawCloud(ctx, light, 300, 127, 45, clock.elapsed + 1300)
      const frame = canvas.getBoundingClientRect()
      const art = canvas.parentElement?.querySelector('[data-title-art]')?.getBoundingClientRect()
      const imageHeight = art ? Math.min(art.height, art.width * 657 / 1354) : 0
      const shoreline = art && frame.height ? Math.round((art.top - frame.top + (art.height - imageHeight) / 2 + imageHeight * .76) / frame.height * 440) : 265
      drawSea(ctx, light, clock.elapsed, shoreline, 640, 440)
      canvas.dataset.sceneTime = String(Math.round(clock.elapsed))
    }
    const render = () => {
      clearTimeout(timer)
      const now = performance.now()
      if (visible && !document.hidden && !paused) clock.elapsed += Math.min(200, now - last)
      last = now; draw()
      if (visible && !document.hidden && !paused) timer = setTimeout(render, 125)
    }
    const wake = () => { last = performance.now(); render() }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake() })
    const resize = new ResizeObserver(wake); resize.observe(canvas)
    observer.observe(canvas); document.addEventListener('visibilitychange', wake); draw()
    return () => { clearTimeout(timer); observer.disconnect(); resize.disconnect(); document.removeEventListener('visibilitychange', wake) }
  }, [clock, paused])
  return <canvas ref={ref} width={640} height={440} aria-hidden="true" data-title-environment className={styles.environment}/>
}

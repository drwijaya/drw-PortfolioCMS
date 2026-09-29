'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { ARRIVAL_DURATION, drawCutscene, type CutscenePhase } from '@/lib/off-the-clock/cutscene'
import { dark, light } from '@/lib/off-the-clock/palette'
import { advanceSceneClock, type SceneClock } from '@/lib/off-the-clock/scene-clock'
import { HEIGHT, WIDTH } from '@/lib/off-the-clock/world'
import styles from './IslandIntro.module.css'

type Props = {
  phase: CutscenePhase
  description: string
  clock: SceneClock
  paused: boolean
  finishRef: RefObject<(() => void) | null>
}

export function NativeCutsceneCanvas({ phase, description, clock, paused, finishRef }: Props) {
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [unavailable,setUnavailable]=useState(false)
  // Phase age is independent of ambient time, and survives theme/pause changes.
  const beatRef=useRef({phase,elapsed:0})
  useEffect(()=>{
    const canvas=canvasRef.current
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx=canvas?.getContext('2d') ?? null } catch { /* Accessible story remains available. */ }
    if(!canvas||!ctx) {
      const id=requestAnimationFrame(()=>setUnavailable(true))
      return()=>cancelAnimationFrame(id)
    }
    const context=ctx
    if(beatRef.current.phase!==phase)beatRef.current={phase,elapsed:0}
    let timer: ReturnType<typeof setTimeout> | undefined
    let visible=false, disposed=false, last=performance.now(), draws=0
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)')
    const draw=()=>{
      const still=paused||reduced.matches
      if(still&&phase==='arrival')beatRef.current.elapsed=Math.max(beatRef.current.elapsed,ARRIVAL_DURATION)
      const beat=still?ARRIVAL_DURATION:beatRef.current.elapsed
      const palette=document.documentElement.dataset.theme==='dark'?dark:light
      const position=drawCutscene(context,phase,palette,clock.elapsed,beat)
      canvas.dataset.drawCount=String(++draws)
      canvas.dataset.sceneTime=String(Math.round(clock.elapsed))
      canvas.dataset.beat=String(Math.round(beat))
      canvas.dataset.actorX=String(position.x);canvas.dataset.actorY=String(position.y)
      canvas.dataset.palette=Object.values(palette).join(',')
      canvas.dataset.motion=still?'paused':'playing'
    }
    const render=()=>{
      timer=undefined
      if(disposed||!visible||document.hidden)return
      const now=performance.now(), delta=now-last
      if(!paused&&!reduced.matches) {
        advanceSceneClock(clock,delta)
        beatRef.current.elapsed+=Math.max(0,Math.min(delta,250))
      }
      last=now;draw()
      if(!paused&&!reduced.matches)timer=setTimeout(render,phase==='arrival'&&beatRef.current.elapsed<ARRIVAL_DURATION?50:100)
    }
    const wake=()=>{clearTimeout(timer);last=performance.now();render()}
    const resize=new ResizeObserver(()=>{
      const bounds=canvas.parentElement?.getBoundingClientRect()
      if(!bounds?.width||!bounds.height)return
      const height=Math.max(HEIGHT,Math.min(900,Math.round(WIDTH*bounds.height/bounds.width)))
      if(canvas.height!==height){canvas.height=height;draw()}
    })
    if(canvas.parentElement)resize.observe(canvas.parentElement)
    finishRef.current=()=>{beatRef.current.elapsed=Math.max(beatRef.current.elapsed,ARRIVAL_DURATION);draw()}
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake()})
    observer.observe(canvas)
    const theme=new MutationObserver(wake)
    theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    reduced.addEventListener('change',wake)
    document.addEventListener('visibilitychange',wake)
    // Paint a complete first frame without advancing time, even before visibility
    // observation. Afterwards only an active, visible scene schedules work.
    draw()
    return()=>{disposed=true;clearTimeout(timer);observer.disconnect();resize.disconnect();theme.disconnect();reduced.removeEventListener('change',wake);document.removeEventListener('visibilitychange',wake);finishRef.current=null}
  },[phase,clock,paused,finishRef])
  return <div className={styles.canvasContainer}>
    <canvas ref={canvasRef} className={styles.nativeCanvas} width={WIDTH} height={HEIGHT} data-native-cutscene={phase} role="img" aria-label={description}>{description}</canvas>
    {unavailable&&<p className={styles.fallback} role="status">{description} Continue to explore, or browse the collections below.</p>}
  </div>
}

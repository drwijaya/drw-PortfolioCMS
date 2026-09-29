'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { defaultLevels, IslandSound, sanitizeLevels, type SoundLevels, type SoundCue } from '@/lib/off-the-clock/sound'
import type { Scene } from '@/lib/off-the-clock/world'

export function useIslandSound(scene: Scene, blocked: boolean) {
  const engine = useRef<IslandSound | null>(null)
  const [enabled,setEnabled] = useState(false)
  const [levels,setLevels] = useState(defaultLevels)
  const [error,setError] = useState('')
  const mounted = useRef(false)
  const wanted = useRef(false)
  useEffect(()=>{
    mounted.current=true
    const id=requestAnimationFrame(()=>{ try { setLevels(sanitizeLevels(JSON.parse(localStorage.getItem('off-clock-sound-levels')||'null'))) } catch {} })
    return ()=>{ mounted.current=false; cancelAnimationFrame(id); engine.current?.destroy(); engine.current=null }
  },[])
  const mute=useCallback(()=>{wanted.current=false;engine.current?.mute();setEnabled(false)},[])
  const enable=useCallback(async()=>{
    wanted.current=true
    try {
      engine.current ??= new IslandSound()
      engine.current.configure(scene,levels,blocked)
      await engine.current.enable()
      if(!wanted.current) { engine.current.mute(); return }
      if(mounted.current) {setEnabled(true);setError('')}
    } catch {if(mounted.current&&wanted.current){setEnabled(false);setError('Sound couldn’t start. Try Sound on again.');}}
  },[scene,levels,blocked])
  useEffect(()=>{engine.current?.configure(scene,levels,blocked)},[scene,levels,blocked,enabled])
  useEffect(()=>{const hide=()=>{if(document.hidden)mute()};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide)},[mute])
  const change=useCallback((key:keyof SoundLevels,value:number)=>{setLevels(previous=>{const next=sanitizeLevels({...previous,[key]:value});try{localStorage.setItem('off-clock-sound-levels',JSON.stringify(next))}catch{}return next})},[])
  const cue=useCallback((kind:SoundCue)=>engine.current?.cue(kind),[])
  return {enabled,levels,error,enable,mute,change,cue}
}
export type SoundControls = ReturnType<typeof useIslandSound>

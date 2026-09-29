'use client'
import { useCallback, useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react'
import { useGameControls, type MoveVector } from './GameControls'
import styles from './RetroConsole.module.css'

export function TouchController() {
  const { active, preferences, touchEnabled } = useGameControls()
  const target = useRef(active), knob = useRef<HTMLSpanElement>(null)
  const pointer = useRef<number | null>(null), vector = useRef<MoveVector>({x:0,y:0}), frame = useRef(0), last = useRef(0), lastAction = useRef(0)
  const dead = useRef(true)
  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current); frame.current = 0; pointer.current = null; vector.current = {x:0,y:0}; dead.current = true
    target.current?.get().move?.({x:0,y:0},0)
    if (knob.current) knob.current.style.transform = 'translate(0px,0px)'
  }, [])
  useLayoutEffect(() => {
    if (target.current?.id !== active?.id || target.current?.canMove !== active?.canMove) stop()
    target.current = active
  }, [active, stop])
  useEffect(() => { stop(); return stop }, [stop, preferences.direction, preferences.swapped, touchEnabled])
  useEffect(() => {
    const hide = () => { if (document.hidden) stop() }
    window.addEventListener('game-controller-reset',stop); window.addEventListener('blur',stop); window.addEventListener('resize',stop); document.addEventListener('visibilitychange',hide)
    return () => { stop(); window.removeEventListener('game-controller-reset',stop); window.removeEventListener('blur',stop); window.removeEventListener('resize',stop); document.removeEventListener('visibilitychange',hide) }
  }, [stop])
  const pump = (now: number) => {
    const dt = Math.min(.05, (now-last.current)/1000)
    last.current = now
    target.current?.get().move?.(vector.current,dt)
    if (pointer.current !== null) frame.current = requestAnimationFrame(pump)
  }
  const update = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== event.pointerId) return
    const bounds = event.currentTarget.getBoundingClientRect(), radius = bounds.width * .30
    const x = event.clientX - bounds.left - bounds.width/2, y = event.clientY - bounds.top - bounds.height/2, length = Math.hypot(x,y)
    const magnitude = Math.min(1, length/radius)
    dead.current = magnitude < (dead.current ? .16 : .11)
    const power = dead.current ? 0 : Math.max(0,(magnitude-.11)/.89)
    vector.current = length ? {x:x/length*power,y:y/length*power} : {x:0,y:0}
    if (knob.current) knob.current.style.transform = `translate(${Math.round(x/Math.max(1,length/radius))}px,${Math.round(y/Math.max(1,length/radius))}px)`
  }
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!active?.canMove || pointer.current !== null || event.button !== 0) return
    event.preventDefault(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); update(event); last.current = event.timeStamp; frame.current=requestAnimationFrame(pump)
  }
  const action = (kind: 'confirm'|'back') => {
    const now=performance.now(); if(now-lastAction.current<220)return; lastAction.current=now
    stop(); const layer = target.current?.get(); if(kind==='confirm' && !target.current?.canConfirm)return; layer?.[kind]?.()
  }
  if (!touchEnabled) return null
  return <div className={styles.controller} data-touch-controller data-swapped={preferences.swapped} data-owner={active?.label}>
    <div className={styles.movement} data-inactive={!active?.canMove}>
      {preferences.direction === 'stick' ? <div className={styles.stick} data-joystick aria-label="Movement joystick. Drag to move; use the directional pad in settings for individual buttons." role="group" onPointerDown={start} onPointerMove={update} onPointerUp={e => { if(e.pointerId===pointer.current)stop() }} onPointerCancel={e => { if(e.pointerId===pointer.current)stop() }} onLostPointerCapture={e => { if(e.pointerId===pointer.current)stop() }}>
        <span className={styles.cross} aria-hidden="true"/><span ref={knob} className={styles.knob} aria-hidden="true"/>
      </div> : <div className={styles.pad} role="group" aria-label="Directional pad">{[['Up',0,-1],['Left',-1,0],['Right',1,0],['Down',0,1]].map(([name,x,y]) => <button key={name} data-direction={name} aria-label={`Move ${name}`} disabled={!active?.canMove} onPointerDown={e => { if(pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);vector.current={x:Number(x),y:Number(y)};last.current=e.timeStamp;frame.current=requestAnimationFrame(pump) }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();pointer.current=-1;vector.current={x:Number(x),y:Number(y)};last.current=e.timeStamp;frame.current=requestAnimationFrame(pump)}}} onKeyUp={stop} onBlur={stop}>{name==='Up'?'↑':name==='Down'?'↓':name==='Left'?'←':'→'}</button>)}</div>}
      <span className={styles.caption}>{active?.canMove ? active.priority === 0 ? 'MOVE' : active.label === 'Drop food' ? 'AIM' : 'CHOOSE' : '—'}</span>
    </div>
    <div className={styles.actions}>
      <button className={styles.a} aria-label={`A: ${active?.label || 'Wait'}`} disabled={!active?.canConfirm} onPointerDown={e=>e.preventDefault()} onPointerUp={()=>action('confirm')} onClick={()=>action('confirm')}>A</button>
      <button className={styles.b} aria-label="B: Back or cancel" disabled={!active?.canBack} onPointerDown={e=>e.preventDefault()} onPointerUp={()=>action('back')} onClick={()=>action('back')}>B</button>
    </div>
    <p className={styles.legend} aria-live="polite">{active?.canConfirm ? 'A · ' : ''}{active?.label || 'Getting ready…'}</p>
  </div>
}

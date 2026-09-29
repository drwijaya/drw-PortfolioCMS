'use client'

import { useRef, useState, type PointerEvent } from 'react'
import type { Favorite } from '@/content/off-the-clock'
import type { ListeningTrack } from '@/content/off-the-clock-listening'
import { armAngle, grooveRadius, innerGroove, outerGroove, pivot, spindle, trackAtRadius } from '@/lib/off-the-clock/turntable'
import { MediaArtwork } from '../MediaArtwork'
import styles from './Turntable.module.css'

export function TurntableDeck({album,tracks,index,playing,parked,progress,onSelect,onLift,onCancel,onPark}:{album:Favorite;tracks:ListeningTrack[];index:number;playing:boolean;parked:boolean;progress:number;onSelect:(index:number)=>void;onLift:()=>void;onCancel:()=>void;onPark:()=>void}) {
  const svg=useRef<SVGSVGElement>(null),gesture=useRef<number|null>(null)
  const [hover,setHover]=useState<number|null>(null),[dragging,setDragging]=useState(false)
  function trackAt(event:PointerEvent<SVGSVGElement>){
    const matrix=svg.current?.getScreenCTM()?.inverse()
    const p=matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix):null
    return p?trackAtRadius(Math.hypot(p.x-spindle.x,p.y-spindle.y),tracks.length):null
  }
  function cancel(){gesture.current=null;setDragging(false);setHover(null);onCancel()}
  const radius=grooveRadius(hover??index,tracks.length,hover===null?progress:0)
  const angle=parked&&!dragging?0:armAngle(dragging?radius:grooveRadius(index,tracks.length,progress))
  return <div className={styles.deck} data-playing={playing} data-dragging={dragging} onKeyDown={e=>{if(e.key==='Escape'&&gesture.current!==null){e.preventDefault();e.stopPropagation();cancel()}}}>
    <div className={styles.deckStage}>
    <div className={styles.record} aria-hidden="true"><div className={styles.label}><MediaArtwork room="music" item={album}/></div><span className={styles.spindle}/></div>
    <svg ref={svg} viewBox="0 0 600 600" className={styles.deckDrawing} role="group" aria-label="Turntable. Drag the needle or choose a song from the track list."
      onPointerMove={event=>setHover(trackAt(event))} onPointerLeave={()=>{if(gesture.current===null)setHover(null)}}
      onPointerDown={event=>{if(event.button!==0)return;const selected=trackAt(event),onArm=(event.target as Element).closest('[data-tonearm]');if(!onArm&&selected===null)return;event.preventDefault();gesture.current=event.pointerId;event.currentTarget.setPointerCapture(event.pointerId);setDragging(true);setHover(selected);onLift()}}
      onPointerUp={event=>{if(gesture.current!==event.pointerId)return;const selected=trackAt(event);gesture.current=null;setDragging(false);setHover(null);event.currentTarget.releasePointerCapture(event.pointerId);if(selected!==null)onSelect(selected);else {const matrix=svg.current?.getScreenCTM()?.inverse();const p=matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix):null;if(p&&p.x>505&&p.y>160&&p.y<465)onPark();else onCancel()}}}
      onPointerCancel={cancel} onLostPointerCapture={()=>{if(gesture.current!==null)cancel()}}>
      <g aria-hidden="true" fill="none">{tracks.map((track,i)=><circle key={track.id} cx={spindle.x} cy={spindle.y} r={outerGroove-i*(outerGroove-innerGroove)/tracks.length} className={styles.grooveBoundary}/>)}{!parked||hover!==null?<circle cx={spindle.x} cy={spindle.y} r={radius} className={styles.activeGroove}/>:null}</g>
      <g className={styles.armBase} aria-hidden="true"><path d="M482 30h99v114h-99z"/><circle cx={pivot.x} cy={pivot.y} r="40"/><circle cx={pivot.x} cy={pivot.y} r="24"/><path d="M531 157h11v274h-11z"/><path d="M520 403h33v13h-33z"/></g>
      <g data-tonearm className={styles.arm} style={{transform:`translate(${pivot.x}px, ${pivot.y}px) rotate(${angle}deg)`}} aria-hidden="true">
        <path className={styles.armHit} d="M0 -36V350"/><path className={styles.counterweight} d="M-21-49h42v65h-42z"/>
        <path className={styles.armShadow} d="M0 0V210q0 45-5 66l5 62"/><path className={styles.armRod} d="M0 0V210q0 45-5 66l5 62"/>
        <path className={styles.headshell} d="M-16 302h32v38l-8 10H-8l-8-10z"/><path className={styles.needle} d="M0 341v12"/>
        <circle className={styles.armScrew} cx="0" cy="0" r="7"/><circle className={styles.armScrew} cx="0" cy="316" r="3"/>
      </g>
      <text x="34" y="581" className={styles.deckEtching} aria-hidden="true">33⅓ RPM · STEREO</text>
    </svg>
    </div>
    <div className={styles.needleHint} aria-hidden="true">{hover!==null?<><span>{String(hover+1).padStart(2,'0')}</span>{tracks[hover].title}<small>{dragging?'Release to play':'Tap groove to play'}</small></>:<>{parked?'Put the needle on a groove':'Lift the needle to change songs'}<small>or choose a track from the sleeve</small></>}</div>
  </div>
}

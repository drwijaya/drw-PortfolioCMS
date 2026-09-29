'use client'

import { useEffect, useRef } from 'react'
import { useTypewriter, type TextSpeed } from './useTypewriter'
import { useSurfaceControls } from './GameControls'
import styles from './IslandIntro.module.css'

type Props = { text: string; speed: TextSpeed; paused: boolean; seen: boolean; arrival: boolean; replaying: boolean; onTick: () => void; onAdvance: () => void; onBack: () => void; onSkip: () => void; onMenu: () => void; actionRef: React.RefObject<(() => void) | null> }
export function PixelDialogue(props: Props) {
  return <DialoguePage {...props}/>
}

function DialoguePage({ text, speed, paused, seen, arrival, replaying, onTick, onAdvance, onBack, onSkip, actionRef }: Props) {
  const writer = useTypewriter(text, speed, paused, seen, onTick)
  const root = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  const { ready, complete, canAdvance } = writer
  const advance=()=>{if(paused)return;if(!ready)complete();else if(canAdvance())onAdvance()}
  useEffect(() => {
    actionRef.current = advance
    return () => { actionRef.current = null }
  })
  const label = !ready ? 'Complete text' : arrival ? replaying ? 'Return to exploring' : 'Explore the island' : 'Continue'
  useSurfaceControls(root,!paused,40,onBack)
  return <div ref={root} className={styles.dialogue} data-dialogue-state={ready ? 'ready' : 'typing'} data-fixed-dialogue>
    <h2 ref={heading} tabIndex={-1} className="sr-only">{arrival ? 'On the island' : 'At sea'}</h2>
    <p className="sr-only" aria-live="polite" aria-atomic="true">{text}</p>
    <div className={styles.storyText} data-story-text tabIndex={0} aria-label="Narration" onClick={advance}>
      <p aria-hidden="true">{writer.characters.map((character, i) => <span key={i} style={{ visibility: i < writer.count ? 'visible' : 'hidden' }}>{character}</span>)}</p>
    </div>
    {<div className={styles.storyActions}>
      <button onClick={onBack}>Back</button><button onClick={onSkip}>Skip intro</button>
      <button data-autofocus className={styles.continue} onClick={event => { if (event.detail < 2) advance() }}>{label}<span className={ready ? styles.marker : undefined} aria-hidden="true">{ready ? '▾' : '···'}</span></button>
    </div>}
  </div>
}

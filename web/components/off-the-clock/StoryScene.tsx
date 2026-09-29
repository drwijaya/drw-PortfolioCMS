'use client'

/* Supplied pixel art is served losslessly; avoid automatic resampling. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from 'react'
import styles from './IslandIntro.module.css'

export function StoryScene({ src, description, title = false, onSettled }: { src: string; description: string; title?: boolean; onSettled?: () => void }) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [ready, setReady] = useState(false)
  const callback = useRef(onSettled)
  useEffect(() => { callback.current = onSettled }, [onSettled])
  useEffect(() => {
    if (ready || failed) { callback.current?.(); return }
    const timer = setTimeout(() => setFailed(true), 8000)
    return () => clearTimeout(timer)
  }, [ready, failed, attempt])
  return <div className={title ? styles.titleArt : styles.storyArt} data-art-ready={ready} data-title-art={title || undefined}>
    {!failed && <img key={attempt} src={src} width={title ? 1354 : 1536} height={title ? 657 : 1024} alt={description} draggable={false} decoding="async" onLoad={() => setReady(true)} onError={() => setFailed(true)}/>}
    {failed && <div className={styles.artError} role="status"><p>The picture couldn’t load. You can still continue the story.</p><button onClick={() => { setFailed(false); setAttempt(v => v + 1) }}>Retry picture</button></div>}
  </div>
}

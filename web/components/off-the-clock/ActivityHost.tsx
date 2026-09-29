'use client'
import { useEffect, useRef, type ReactNode } from 'react'
import { useSurfaceControls } from './GameControls'
import styles from './GameUI.module.css'

/** A surface inside the game. Only GameFrame's explicit Focus mode is modal. */
export function ActivityHost({ open, title, children, mode = 'activity', fitted = false, onClose }: {
  open: boolean; title: string; children: ReactNode; mode?: 'inspect'|'notebook'|'activity'; onClose: () => void; fitted?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('game-surface-open'))
      window.dispatchEvent(new Event('cursor-surface-change'))
    })
    return () => { cancelAnimationFrame(id); requestAnimationFrame(() => { if(origin?.isConnected && !origin.closest('[inert]')) origin.focus({preventScroll:true}); window.dispatchEvent(new Event('cursor-surface-change')) }) }
  }, [open, mode])
  useSurfaceControls(ref,open,20,onClose,onClose)
  if (!open) return null
  return <section ref={ref} className={`${styles.surface} ${styles[mode]}`} aria-labelledby="game-surface-title" data-game-surface={mode}>
    <header className={styles.surfaceHeader}><h2 id="game-surface-title" data-surface-title tabIndex={-1}>{title}</h2></header>
    <div className={`${styles.surfaceBody} ${fitted ? styles.fittedBody : ''}`}>{children}</div>
  </section>
}

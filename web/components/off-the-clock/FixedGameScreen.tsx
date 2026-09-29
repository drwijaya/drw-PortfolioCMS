'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import styles from './RetroConsole.module.css'
import ui from './GameUI.module.css'

/** A single logical game frame. Device size changes only its final display scale. */
export function FixedGameScreen({ children, view }: { children: ReactNode; view: string }) {
  const screen = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = screen.current
    if (!element) return
    const resize = () => element.style.setProperty('--game-scale', String(element.clientWidth / 480))
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return <div ref={screen} className={styles.screen} data-game-screen>
    <div className={`${ui.viewport} ${styles.logical}`} data-logical-screen data-game-viewport data-view={view}>
      {children}
    </div>
  </div>
}

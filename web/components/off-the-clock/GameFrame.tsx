'use client'

import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useGameControls } from './GameControls'
import styles from './OffTheClock.module.css'

/** The same scene remains mounted when the frame becomes a native modal. */
export function GameFrame({ focused, children, onBack }: { onBack: () => void; focused: boolean; children: ReactNode }) {
  const { touchEnabled } = useGameControls()
  const ref = useRef<HTMLDialogElement>(null)
  const aligned = useRef(false)
  const restore = useRef(false)
  const returnPosition = useRef({ x: 0, y: 0, element: null as HTMLElement | null })

  useLayoutEffect(() => {
    const frame = ref.current
    if (!frame) return
    if (focused) {
      returnPosition.current = { x: window.scrollX, y: window.scrollY, element: document.activeElement as HTMLElement }
      frame.close(); frame.showModal(); window.dispatchEvent(new Event('cursor-surface-change'))
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previous
        frame.close(); restore.current = true; window.dispatchEvent(new Event('cursor-surface-change'))
      }
    }
    if (!frame.open) {
      // A collections deep link must not focus a game button and start the
      // browser's smooth focus-scroll while the page is aligning its anchor.
      const browsingCollections = window.location.hash === '#collections'
      if (browsingCollections) frame.inert = true
      frame.show()
      if (browsingCollections) frame.inert = false
    }
    if (restore.current) {
      const id = requestAnimationFrame(() => {
        restore.current = false
        window.scrollTo({ left: returnPosition.current.x, top: returnPosition.current.y, behavior: 'instant' })
        returnPosition.current.element?.focus({ preventScroll: true })
      })
      return () => cancelAnimationFrame(id)
    }
  }, [focused])

  useLayoutEffect(() => {
    const frame = ref.current
    if (!frame) return
    let raf = 0
    let anchorFrame = 0
    let disposed = false
    let alignAfterResize = false
    const measure = () => {
      const viewport = window.visualViewport
      const vh = viewport?.height ?? window.innerHeight
      let top = 12, bottom = 12
      if (!focused) {
        for (const element of document.querySelectorAll<HTMLElement>('[data-chrome="header"], [data-page-header]')) {
          if (!element.getClientRects().length) continue
          const style = getComputedStyle(element)
          const inset = parseFloat(style.top) || 0
          top = Math.max(top, inset + element.offsetHeight + 16)
        }
        const dock = document.querySelector<HTMLElement>('[data-chrome="dock"]')
        if (dock?.getClientRects().length) bottom = Math.max(bottom, window.innerHeight - dock.getBoundingClientRect().top + 12)
      }
      frame.style.setProperty('--toolbar-height', `${frame.querySelector<HTMLElement>('[data-frame-chrome]')?.offsetHeight ?? 48}px`)
      const chrome = Array.from(frame.querySelectorAll<HTMLElement>('[data-frame-chrome]')).reduce((sum, e) => sum + e.getBoundingClientRect().height, 0)
      const width = frame.clientWidth
      const padding = window.innerWidth <= 360 ? 12 : 24
      const availableHeight = Math.max(160, vh - top - bottom - chrome - padding - 4)
      const rails = touchEnabled && window.innerWidth > vh && width - padding - 284 >= 264 && availableHeight >= 198
      frame.dataset.controllerLayout = rails ? 'rails' : 'stacked'
      const deck = touchEnabled && !rails ? 164 : 0
      const availableWidth = Math.max(160, width - padding - (rails ? 284 : 0))
      // The display is always 4:3; only the controller shell changes shape.
      const screenWidth = Math.floor(Math.min(availableWidth, Math.max(198, availableHeight - deck) * 4 / 3, 1040))
      if(frame.style.getPropertyValue('--screen-width')!==`${screenWidth}px`) window.dispatchEvent(new Event('game-controller-reset'))
      frame.style.setProperty('--screen-width', `${screenWidth}px`)
      frame.style.scrollMarginTop = `${top}px`
      if (!focused) frame.parentElement?.style.setProperty('--frame-height', `${frame.getBoundingClientRect().height}px`)
      if (!aligned.current && !focused && window.location.hash === '#collections') {
        aligned.current = true
        // The client-only game replaces the loader and changes page height.
        // Align the requested anchor after fonts and that layout have settled.
        void document.fonts.ready.then(() => {
          if (disposed) return
          anchorFrame = requestAnimationFrame(() => {
            if (window.location.hash === '#collections') document.getElementById('collections')?.scrollIntoView({ block: 'start', behavior: 'instant' })
          })
        })
      }
      if ((!aligned.current || alignAfterResize) && !focused && window.location.hash !== '#collections') {
        aligned.current = true; alignAfterResize = false
        const rect = frame.getBoundingClientRect()
        if (rect.bottom > vh - bottom || rect.top < top) frame.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
    }
    const resize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    const viewportResize = () => {
      const rect = frame.getBoundingClientRect()
      // Keep a visible game in view after rotation without pulling a reader back
      // from another part of the page on ordinary layout or scroll changes.
      alignAfterResize = rect.top < window.innerHeight && rect.bottom > 0
      resize()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(frame)
    if(frame.parentElement)observer.observe(frame.parentElement)
    frame.querySelectorAll<HTMLElement>('[data-frame-chrome]').forEach(e => observer.observe(e))
    window.addEventListener('game-surface-open', viewportResize); window.addEventListener('resize', viewportResize); window.visualViewport?.addEventListener('resize', viewportResize)
    measure()
    return () => { disposed = true; cancelAnimationFrame(raf); cancelAnimationFrame(anchorFrame); observer.disconnect(); window.removeEventListener('game-surface-open', viewportResize); window.removeEventListener('resize', viewportResize); window.visualViewport?.removeEventListener('resize', viewportResize) }
  }, [focused, touchEnabled])

  return <div className={styles.gameFrameSlot}><dialog ref={ref} className={`${styles.experience} ${styles.gameFrame}`} data-retro-game data-cursor="hide" data-focused={focused} aria-label="Off the Clock game" onKeyDown={event => { if(event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); event.stopPropagation(); if(!event.repeat)onBack() } }} onCancel={event => { if (event.target === event.currentTarget) { event.preventDefault(); onBack() } }}>{children}</dialog></div>
}

'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import Image from '@/components/cms/ContentImage'
import { TransitionLink, type RouteDirection } from '@/components/navigation/RouteTransition'
import type { Project } from '@/lib/types'
import { workTypeLabel } from '@/lib/work'

import styles from './WorkCarousel.module.css'

type CarouselProject = Pick<
  Project,
  'slug' | 'title' | 'thumb' | 'presentationType' | 'practice' | 'year'
>

export function WorkCarousel({
  projects,
  currentSlug,
}: {
  projects: CarouselProject[]
  currentSlug: string
}) {
  const currentIndex = projects.findIndex((project) => project.slug === currentSlug)
  const count = projects.length
  const [smallStart, setSmallStart] = useState(Math.max(currentIndex, 0))
  const rootRef = useRef<HTMLElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const cycleWidthRef = useRef(0)

  // The middle copy owns keyboard and screen-reader navigation. Repeated
  // copies let native touch and trackpad scrolling move freely at both ends.
  const looping = count >= 3
  const ordered = looping
    ? [...projects.slice(currentIndex), ...projects.slice(0, currentIndex)]
    : [...projects.slice(smallStart), ...projects.slice(0, smallStart)]

  useLayoutEffect(() => {
    if (!looping) return
    const viewport = viewportRef.current
    if (!viewport) return

    const measure = () => {
      const cycles = viewport.querySelectorAll<HTMLElement>('.' + styles.cycle)
      if (cycles.length < 3) return
      const width = cycles[1].offsetLeft - cycles[0].offsetLeft
      if (!width) return
      const oldWidth = cycleWidthRef.current
      const offset = oldWidth ? (viewport.scrollLeft - oldWidth * 2) / oldWidth : 0
      cycleWidthRef.current = width
      viewport.scrollLeft = width * (2 + offset)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [looping, count, currentSlug])

  useLayoutEffect(() => {
    if (!looping) return
    const root = rootRef.current
    const viewport = viewportRef.current
    if (!root || !viewport) return

    // Shift+wheel can arrive as deltaX or deltaY, depending on the browser.
    const onWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY
      if (!delta) return
      event.preventDefault()
      viewport.scrollLeft += delta
    }

    let settleTimer = 0
    const normalize = () => {
      const width = cycleWidthRef.current
      if (!width) return
      const cyclesAway = Math.floor((viewport.scrollLeft - width * 2) / width + 0.5)
      if (cyclesAway) viewport.scrollLeft -= cyclesAway * width
    }
    const onScroll = () => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(normalize, 140)
    }

    root.addEventListener('wheel', onWheel, { passive: false })
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.clearTimeout(settleTimer)
      root.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('scroll', onScroll)
    }
  }, [looping])

  const move = useCallback((direction: -1 | 1) => {
    if (count < 2) return
    const viewport = viewportRef.current
    if (!looping || !viewport) {
      setSmallStart((index) => (index + direction + count) % count)
      viewport?.scrollTo({ left: 0, behavior: 'instant' })
      return
    }
    const card = viewport.querySelector<HTMLElement>('.' + styles.card)
    const cycle = viewport.querySelector<HTMLElement>('.' + styles.cycle)
    if (!card || !cycle) return
    const gap = parseFloat(getComputedStyle(cycle).gap) || 0
    viewport.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }, [count, looping])

  if (currentIndex < 0 || count === 0) return null

  const card = (project: CarouselProject, position: number, copy: number) => {
    const index = projects.findIndex((item) => item.slug === project.slug)
    const isCurrent = project.slug === currentSlug
    const clone = looping && copy !== 2
    const number = String(index + 1).padStart(2, '0')
    const content = (
      <>
        <span className={styles.number}>{number}</span>
        <span className={styles.imageFrame}>
          <Image
            src={project.thumb}
            alt=""
            width={400}
            height={215}
            sizes="(max-width: 679px) 200px, 196px"
            className={styles.image}
          />
        </span>
        <span className={styles.title}>{project.title}</span>
        <span className={styles.meta}>
          {workTypeLabel(project.presentationType)} · {project.practice}
          <br />{project.year}
        </span>
        {isCurrent && <span className={styles.currentBadge}>Current work</span>}
      </>
    )

    if (isCurrent) {
      return (
        <div
          key={project.slug}
          className={styles.card + ' ' + styles.current}
          {...(!clone ? { 'aria-current': 'page' as const } : {})}
        >
          {content}
        </div>
      )
    }

    const currentPosition = looping
      ? 0
      : (currentIndex - smallStart + count) % count
    const direction: RouteDirection = looping
      ? copy < 2 || (copy === 2 && position < currentPosition) ? 'back' : 'forward'
      : position < currentPosition ? 'back' : 'forward'
    return (
      <TransitionLink
        key={project.slug}
        href={'/works/' + project.slug}
        direction={direction}
        tabIndex={clone ? -1 : undefined}
        className={styles.card}
        aria-label={'Open work ' + number + ': ' + project.title}
      >
        {content}
      </TransitionLink>
    )
  }

  return (
    <nav ref={rootRef} className={styles.carousel} aria-label="Continue exploring works">
      <div className={styles.header}>
        <h2>Continue exploring</h2>
        <span className={styles.rule} aria-hidden="true" />
        {count > 1 && (
          <div className={styles.controls}>
            <button type="button" onClick={() => move(-1)} aria-label="Show previous work" className={styles.arrow}>←</button>
            <button type="button" onClick={() => move(1)} aria-label="Show next work" className={styles.arrow}>→</button>
          </div>
        )}
      </div>
      <div ref={viewportRef} className={styles.viewport} aria-label="Scroll works horizontally">
        <div className={styles.track}>
          {Array.from({ length: looping ? 5 : 1 }, (_, copy) => (
            <div
              className={styles.cycle}
              key={copy}
              aria-hidden={looping && copy !== 2 ? true : undefined}
            >
              {ordered.map((project, position) => card(project, position, copy))}
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}

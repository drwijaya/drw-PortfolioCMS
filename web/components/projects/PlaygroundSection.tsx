'use client'

import Image from '@/components/cms/ContentImage'
import { LayoutGroup, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import type { View } from '@/components/ui/ViewToggle'
import { LAYOUT } from '@/lib/motion'
import type { PlaygroundItem } from '@/lib/types'
import { useFinePointer } from '@/lib/useFinePointer'
import { workTypeCta } from '@/lib/work'

import { HoverThumb } from './HoverThumb'
import { PlaygroundTile } from './PlaygroundTile'
import styles from './Projects.module.css'

function PlaygroundRow({ item, index, onActivate }: { item: PlaygroundItem; index: number; onActivate: () => void }) {
  const cursor = useCursor()
  const cta = workTypeCta('playground')

  const content = (
    <>
      <span className={styles.rowIndex}>{String(index + 1).padStart(2, '0')}</span>
      <motion.span
        layout
        layoutId={`playground:${item.slug}:frame`}
        transition={LAYOUT.morph}
        className={styles.rowThumb}
      >
        <Image
          src={item.preview}
          alt=""
          width={64}
          height={44}
          sizes="64px"
          className={styles.rowThumbImg}
        />
      </motion.span>
      <span className={styles.rowIdentity}>
        <motion.span
          layout
          layoutId={`playground:${item.slug}:title`}
          transition={LAYOUT.morph}
          className={styles.rowTitle}
        >{item.title}</motion.span>
      </span>
      <span className={styles.rowMeta}>Playground · {item.medium}</span>
      <span className={styles.rowYear}>{item.listedAt.slice(0, 4)}</span>
      <span className={styles.rowArrow} aria-hidden>→</span>
    </>
  )

  return (
    <div className={styles.row} role="listitem">
      {item.destinationType === 'external' ? (
        <a
          href={item.destination}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.rowLink}
          aria-label={`${item.title}. ${cta}`}
          onPointerEnter={onActivate}
          onFocus={onActivate}
          {...cursor.bind('soft')}
        >
          {content}
        </a>
      ) : (
        <TransitionLink
          href={item.destination}
          className={styles.rowLink}
          aria-label={`${item.title}. ${cta}`}
          onPointerEnter={onActivate}
          onFocus={onActivate}
          {...cursor.bind('soft')}
        >
          {content}
        </TransitionLink>
      )}
    </div>
  )
}

export function PlaygroundSection({
  items,
  view,
  animateEntrance = true,
}: {
  items: PlaygroundItem[]
  view: View
  animateEntrance?: boolean
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const [canScroll, setCanScroll] = useState({ prev: false, next: false })
  const [active, setActive] = useState<string | null>(null)
  const fine = useFinePointer()

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const sync = () => {
      setCanScroll({
        prev: rail.scrollLeft > 2,
        next: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 2,
      })
    }
    const resize = new ResizeObserver(sync)
    resize.observe(rail)
    rail.addEventListener('scroll', sync, { passive: true })
    sync()

    return () => {
      resize.disconnect()
      rail.removeEventListener('scroll', sync)
    }
  }, [items.length])

  const move = (direction: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.querySelector<HTMLElement>('[data-playground-card]')
    const step = card ? card.offsetWidth + 22 : rail.clientWidth * 0.8
    rail.scrollBy({
      left: direction * step,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  if (view === 'list') {
    return (
      <LayoutGroup id="playground-works">
        <div className={styles.table} data-playground-view="list" role="list" onPointerLeave={() => setActive(null)}>
          {items.map((item, index) => (
            <PlaygroundRow key={item.slug} item={item} index={index} onActivate={() => setActive(item.slug)} />
          ))}
        </div>
        {fine && <HoverThumb
          images={items.map((item) => ({
            slug: item.slug,
            src: item.preview,
            width: item.previewWidth,
            height: item.previewHeight,
          }))}
          activeSlug={active}
        />}
      </LayoutGroup>
    )
  }

  return (
    <LayoutGroup id="playground-works">
      <div className={styles.playgroundCarousel} data-playground-view="grid">
        <div
          ref={railRef}
          className={styles.playgroundRail}
          role="region"
          aria-label="My recent playground"
          tabIndex={0}
        >
          {items.map((item, index) => (
            <div key={item.slug} data-playground-card className={styles.playgroundSlide}>
              <PlaygroundTile item={item} index={index} compact animateEntrance={animateEntrance} />
            </div>
          ))}
        </div>
        {(canScroll.prev || canScroll.next) && (
          <div className={styles.playgroundControls} aria-label="Carousel controls">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={!canScroll.prev}
              aria-label="Previous playground item"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={!canScroll.next}
              aria-label="Next playground item"
            >
              →
            </button>
          </div>
        )}
      </div>
    </LayoutGroup>
  )
}

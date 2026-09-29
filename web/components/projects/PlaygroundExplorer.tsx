'use client'

import Image from '@/components/cms/ContentImage'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useState } from 'react'

import { useCursor } from '@/components/cursor/CursorProvider'
import { Cascade } from '@/components/motion/Cascade'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { PageHeader } from '@/components/ui/PageHeader'
import { ViewToggle, type View } from '@/components/ui/ViewToggle'
import { DUR, EASE, SPRING } from '@/lib/motion'
import type { PlaygroundItem } from '@/lib/types'

import { PlaygroundTile } from './PlaygroundTile'
import styles from './Projects.module.css'

function PlaygroundRow({ item, index }: { item: PlaygroundItem; index: number }) {
  const cursor = useCursor()
  const content = (
    <>
      <motion.span
        className={styles.rowIndex}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.quick, ease: EASE.out, delay: 0.12 }}
      >
        {String(index).padStart(2, '0')}
      </motion.span>
      <motion.span
        layout
        layoutId={`playground:${item.slug}:frame`}
        transition={SPRING.snap}
        className={styles.rowThumb}
      >
        <Image
          src={item.preview}
          alt=""
          width={64}
          height={44}
          className={styles.rowThumbImg}
        />
      </motion.span>
      <span className={styles.rowIdentity}>
        <motion.span
          layout
          layoutId={`playground:${item.slug}:title`}
          transition={SPRING.snap}
          className={styles.rowTitle}
        >
          {item.title}
        </motion.span>
      </span>
      <motion.span
        className={styles.rowMeta}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.quick, ease: EASE.out, delay: 0.12 }}
      >
        Playground · {item.medium}
      </motion.span>
      <motion.span
        className={styles.rowYear}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DUR.quick, ease: EASE.out, delay: 0.12 }}
      >
        {item.listedAt.slice(0, 4)}
      </motion.span>
      <span className={styles.rowArrow} aria-hidden>→</span>
    </>
  )

  return (
    <motion.div
      layout
      layoutId={`playground:${item.slug}`}
      transition={SPRING.snap}
      className={styles.row}
    >
      {item.destinationType === 'external' ? (
        <a
          href={item.destination}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.rowLink}
          {...cursor.bind('soft')}
        >
          {content}
        </a>
      ) : (
        <TransitionLink
          href={item.destination}
          className={styles.rowLink}
          {...cursor.bind('soft')}
        >
          {content}
        </TransitionLink>
      )}
    </motion.div>
  )
}

export function PlaygroundExplorer({ items }: { items: PlaygroundItem[] }) {
  const [view, setView] = useState<View>('grid')

  return (
    <>
      <PageHeader
        first
        as="h1"
        label="Playground"
        actions={
          <>
            <span className={styles.indexCount}>
              {items.length} {items.length === 1 ? 'experiment' : 'experiments'}
            </span>
            {items.length >= 4 && <ViewToggle value={view} onChange={setView} />}
          </>
        }
      />
      {items.length ? (
        <LayoutGroup id="playground">
          <AnimatePresence mode="popLayout" initial={false}>
            {view === 'grid' ? (
              <div key="grid" className={styles.masonry}>
                {items.map((item, index) => (
                  <div key={item.slug} className={styles.masonryItem}>
                    <PlaygroundTile item={item} index={index} />
                  </div>
                ))}
              </div>
            ) : (
              <div key="list" className={styles.table}>
                {items.map((item, index) => (
                  <PlaygroundRow key={item.slug} item={item} index={index + 1} />
                ))}
              </div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      ) : (
        <Cascade index={1}>
          <p className={styles.playgroundEmpty}>New experiments are coming soon.</p>
        </Cascade>
      )}
    </>
  )
}

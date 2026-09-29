'use client'

// ─────────────────────────────────────────────────────────────────────────
// The one showpiece interaction: a thumbnail that trails the cursor with
// lag and tilts with horizontal velocity.
//
// Every image renders on mount, stacked and transparent. A thumbnail that
// pops in on first hover ruins the effect.
// ─────────────────────────────────────────────────────────────────────────

import Image from '@/components/cms/ContentImage'
import { useEffect } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'

import { sizeOf } from '@/content/image-sizes'
import styles from './Projects.module.css'

const W = 280
/** Keep it clear of the fixed sidebar. */
const GUTTER = 24

interface Props {
  images: { slug: string; src: string; width: number; height: number }[]
  activeSlug: string | null
}

export function HoverThumb({ images, activeSlug }: Props) {
  const reduced = useReducedMotion()
  const activeImage = images.find((image) => image.slug === activeSlug)
  const activeSize = activeImage ?? sizeOf('')
  const previewHeight = Math.round((W * activeSize.height) / activeSize.width)

  const x = useMotionValue(-999)
  const y = useMotionValue(-999)

  // Loose on purpose: this one is meant to trail. The cursor dot uses a
  // much stiffer spring so it feels attached instead.
  const sx = useSpring(x, { stiffness: 140, damping: 20, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 140, damping: 20, mass: 0.6 })

  const vx = useVelocity(sx)
  const tilt = useTransform(vx, [-1400, 0, 1400], [-6, 0, 6], { clamp: true })

  useEffect(() => {
    if (reduced) return

    const sidebar = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        '--sidebar-w'
      )
      return parseInt(raw, 10) || 0
    }

    const move = (e: PointerEvent) => {
      x.set(Math.max(e.clientX + 26, sidebar() + GUTTER))
      y.set(e.clientY - previewHeight / 2)
    }

    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [x, y, reduced, previewHeight])

  if (reduced) return null

  return (
    <motion.div
      className={styles.floatThumb}
      style={{ x: sx, y: sy, rotate: tilt, width: W }}
      animate={{
        height: previewHeight,
        opacity: activeSlug ? 1 : 0,
        scale: activeSlug ? 1 : 0.92,
      }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden
    >
      {images.map((image) => (
          <Image
            key={image.slug}
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            sizes={`${W}px`}
            className={`${styles.floatImg} ${
              image.slug === activeSlug ? styles.floatOn : ''
            }`}
          />
      ))}
    </motion.div>
  )
}

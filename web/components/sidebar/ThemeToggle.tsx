'use client'

import { useTheme } from 'next-themes'
import { useRef, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'

import { useCursor } from '@/components/cursor/CursorProvider'
import { Moon, Sun } from '@/components/icons'
import styles from './Sidebar.module.css'
import { useHydrated } from '@/lib/use-hydrated'

type ThemeViewTransition = {
  finished: Promise<void>
  skipTransition?: () => void
}

type ThemeTransitionDocument = Document & {
  activeViewTransition?: ThemeViewTransition | null
  startViewTransition?: (
    update: () => Promise<void> | void
  ) => ThemeViewTransition
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const cursor = useCursor()
  const mounted = useHydrated()
  const activeTransition = useRef<ThemeViewTransition | null>(null)

  // The server has no idea which theme the visitor picked, so render the
  // icon from the client snapshot only. Otherwise the markup mismatches.
  const dark = resolvedTheme === 'dark'

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme = dark ? 'light' : 'dark'
    const root = document.documentElement
    const source = event.currentTarget
    const transitionDocument = document as ThemeTransitionDocument
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    const applyTheme = () => {
      // The explicit DOM write guarantees that the browser's new snapshot
      // contains the complete destination palette. next-themes still owns
      // React state and persistence; this only closes the passive-effect gap.
      flushSync(() => setTheme(nextTheme))
      root.setAttribute('data-theme', nextTheme)
      root.style.colorScheme = nextTheme
    }

    if (
      reducedMotion ||
      typeof transitionDocument.startViewTransition !== 'function'
    ) {
      applyTheme()
      return
    }

    // A second press should reverse immediately, not queue behind the first
    // reveal. This also prevents a route transition and a theme transition
    // from painting two independent snapshot trees at once.
    activeTransition.current?.skipTransition?.()
    transitionDocument.activeViewTransition?.skipTransition?.()
    activeTransition.current = null
    document
      .querySelectorAll<HTMLElement>('[data-theme-transition-source]')
      .forEach((element) => delete element.dataset.themeTransitionSource)

    const bounds = source.getBoundingClientRect()
    const x = bounds.left + bounds.width / 2
    const y = bounds.top + bounds.height / 2
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    root.style.setProperty('--theme-x', `${x}px`)
    root.style.setProperty('--theme-y', `${y}px`)
    root.style.setProperty('--theme-radius', `${Math.ceil(radius) + 2}px`)
    root.dataset.themeTransition = `to-${nextTheme}`
    source.dataset.themeTransitionSource = 'true'

    let transition: ThemeViewTransition
    try {
      transition = transitionDocument.startViewTransition(applyTheme)
    } catch {
      delete root.dataset.themeTransition
      delete source.dataset.themeTransitionSource
      applyTheme()
      return
    }

    activeTransition.current = transition
    void transition.finished
      .finally(() => {
        if (activeTransition.current !== transition) return
        activeTransition.current = null
        delete root.dataset.themeTransition
        delete source.dataset.themeTransitionSource
        root.style.removeProperty('--theme-x')
        root.style.removeProperty('--theme-y')
        root.style.removeProperty('--theme-radius')
      })
      .catch(() => {})
  }

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      data-theme-toggle
      {...cursor.bind('soft')}
    >
      <span className={styles.themeIcon} aria-hidden>
        {mounted ? dark ? <Sun /> : <Moon /> : <span />}
      </span>
    </button>
  )
}

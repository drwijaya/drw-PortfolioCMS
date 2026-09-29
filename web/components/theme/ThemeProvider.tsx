'use client'

import { MotionConfig } from 'motion/react'
import { ThemeProvider as NextThemes } from 'next-themes'
import type { ReactNode } from 'react'

/**
 * The tokens key off [data-theme], not the class attribute, so next-themes
 * is told to write that attribute. It also injects the pre-paint script
 * that the Flask base.html used to hand-roll.
 */
export function ThemeProvider({ children, forcedTheme }: { children: ReactNode; forcedTheme?: string }) {
  return (
    <NextThemes
      attribute="data-theme"
      forcedTheme={forcedTheme}
      defaultTheme="light"
      enableSystem={false}
      /* ThemeToggle freezes live CSS transitions while a native snapshot is
         captured. Leaving this off here gives older browsers the existing
         token-level colour transitions instead of an abrupt theme swap. */
      disableTransitionOnChange={false}
    >
      {/* reducedMotion="user" makes every Motion component honour the OS
          preference without each one asking. Rule 8 is enforced centrally. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </NextThemes>
  )
}

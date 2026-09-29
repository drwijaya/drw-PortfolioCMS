'use client'

import Image from '@/components/cms/ContentImage'
import { usePathname } from 'next/navigation'

import { TransitionLink } from '@/components/navigation/RouteTransition'
import { ThemeToggle } from '@/components/sidebar/ThemeToggle'
import styles from './Mobile.module.css'

/**
 * The interactive half of the mobile header. Split from MobileHeader because
 * knowing which route we're on — to show the back button over a detail
 * page — needs usePathname, and that forces a client boundary. The profile
 * fetch stays server-side in the parent and arrives here as a prop.
 */
export function MobileHeaderNav({ homeLabel }: { homeLabel: string }) {
  const pathname = usePathname()
  const onCaseStudy = pathname.startsWith('/works/')
  const onOffTheClock = /^\/playground\/offtheclock\/?$/.test(pathname)
  const roomMatch = pathname.match(/^\/playground\/offtheclock\/(homelab|music|film|games)(?:\/journal\/[^/]+)?\/?$/)
  const isJournal = pathname.includes('/journal/')
  let backHref: string | null = null
  let backLabel = ''

  if (onCaseStudy) {
    backHref = '/works'
    backLabel = 'Back to all works'
  } else if (onOffTheClock) {
    backHref = '/playground'
    backLabel = 'Back to Playground'
  } else if (roomMatch) {
    backHref = isJournal
      ? `/playground/offtheclock/${roomMatch[1]}`
      : '/playground/offtheclock'
    backLabel = isJournal ? 'Back to the room' : 'Back to Off the Clock'
  }

  return (
    <>
      {backHref && (
        <TransitionLink
          href={backHref}
          className={styles.headerBack}
          aria-label={backLabel}
        >
          <span className={styles.headerBackArrow} aria-hidden />
        </TransitionLink>
      )}

      <TransitionLink href="/works" className={styles.headerMark} aria-label={homeLabel}>
        <Image
          src="/logo-wordmark.png"
          alt=""
          width={747}
          height={334}
          sizes="54px"
          className={styles.headerMarkImg}
        />
      </TransitionLink>

      <span className={styles.headerToggle}>
        <ThemeToggle />
      </span>
    </>
  )
}

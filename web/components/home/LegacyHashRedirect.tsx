'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const LEGACY_HASH_ROUTES: Record<string, string> = {
  '#works': '/works',
  '#about': '/about',
  '#contacts': '/contact',
  '#contact': '/contact',
}

/**
 * URL fragments never reach the server, so old shared /#… links are migrated
 * after hydration. Internal navigation no longer creates these URLs.
 */
export function LegacyHashRedirect() {
  const router = useRouter()

  useEffect(() => {
    const destination = LEGACY_HASH_ROUTES[window.location.hash.toLowerCase()]
    if (destination && destination !== window.location.pathname) {
      router.replace(destination)
    }
  }, [router])

  return null
}

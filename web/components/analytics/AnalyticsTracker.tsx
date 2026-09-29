'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { trackAnalyticsEvent } from '@/lib/analytics'
import { useSiteConfig } from '@/components/cms/SiteConfig'

function projectSlug(pathname: string) {
  return pathname.match(/^\/works\/([a-z0-9-]+)\/?$/)?.[1]
}

function outboundDestination(href: string) {
  if (href.startsWith('mailto:')) return 'email'
  try {
    const host = new URL(href, window.location.href).hostname
    if (host.includes('linkedin.com')) return 'linkedin'
    if (host.includes('github.com')) return 'github'
    if (host.includes('instagram.com')) return 'instagram'
  } catch {
    return null
  }
  return null
}

export function AnalyticsTracker() {
  const {analyticsEnabled}=useSiteConfig()
  const pathname = usePathname()
  const lastPage = useRef('')

  useEffect(() => {
    if(!analyticsEnabled) return
    if (lastPage.current === pathname) return
    lastPage.current = pathname
    trackAnalyticsEvent('page_view')
  }, [pathname, analyticsEnabled])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor) return

      const href = anchor.getAttribute('href') ?? ''
      const slug = href.match(/^\/works\/([a-z0-9-]+)\/?$/)?.[1]
      if (slug) {
        trackAnalyticsEvent('project_open', {
          projectSlug: slug,
          source: anchor.dataset.analyticsSource ?? 'unknown',
        })
        return
      }

      if (href.includes('drive.google.com/file/')) {
        trackAnalyticsEvent('cv_download', { placement: 'about' })
        return
      }

      const destination = outboundDestination(href)
      if (destination) {
        trackAnalyticsEvent('outbound_profile_click', {
          destination,
          placement: pathname === '/contact' ? 'contact' : 'sidebar',
        })
      }
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [pathname, analyticsEnabled])

  useEffect(() => {
    const slug = projectSlug(pathname)
    if (!slug) return

    const sent = new Set<number>()
    const onScroll = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight
      if (available <= 0) return
      const progress = Math.round((window.scrollY / available) * 100)
      for (const milestone of [50, 75, 100]) {
        if (progress >= milestone && !sent.has(milestone)) {
          sent.add(milestone)
          trackAnalyticsEvent('project_progress', { projectSlug: slug, milestone })
        }
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname, analyticsEnabled])

  return null
}

export const ANALYTICS_API = (
  process.env.NEXT_PUBLIC_ANALYTICS_API_URL ?? ''
).replace(/\/$/, '')

export type AnalyticsEventName =
  | 'page_view'
  | 'project_open'
  | 'project_progress'
  | 'cv_download'
  | 'contact_form_start'
  | 'contact_submit'
  | 'outbound_profile_click'

type EventProperties = Record<string, string | number>

function sessionId() {
  const key = 'drw-analytics-session'
  let value = window.sessionStorage.getItem(key)
  if (!value) {
    // `randomUUID()` is restricted to secure contexts. The portfolio also
    // runs on a plain HTTP LAN address during review, so keep analytics from
    // breaking hydration there while retaining UUIDs on HTTPS deployments.
    value = window.crypto?.randomUUID?.() ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(key, value)
  }
  return value
}

function campaign() {
  const key = 'drw-analytics-campaign'
  const current = new URLSearchParams(window.location.search)
  const fresh = {
    utmSource: current.get('utm_source') ?? '',
    utmMedium: current.get('utm_medium') ?? '',
    utmCampaign: current.get('utm_campaign') ?? '',
    utmContent: current.get('utm_content') ?? '',
  }

  if (fresh.utmSource || fresh.utmMedium || fresh.utmCampaign) {
    window.sessionStorage.setItem(key, JSON.stringify(fresh))
    return fresh
  }

  try {
    return JSON.parse(window.sessionStorage.getItem(key) ?? '{}') as typeof fresh
  } catch {
    return fresh
  }
}

export function trackAnalyticsEvent(
  event: AnalyticsEventName,
  properties: EventProperties = {}
) {
  if (
    !ANALYTICS_API ||
    typeof window === 'undefined' ||
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ||
    window.location.pathname.startsWith('/analytics') ||
    window.location.pathname.startsWith('/admin') ||
    navigator.doNotTrack === '1'
  ) {
    return
  }

  const payload = {
    event,
    properties,
    sessionId: sessionId(),
    path: window.location.pathname,
    title: document.title,
    referrer: document.referrer,
    locale: navigator.language,
    screenWidth: window.innerWidth,
    ...campaign(),
  }

  const body = JSON.stringify(payload)
  const send = (base: string) => fetch(`${base}/v1/collect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'omit',
    keepalive: true,
  })

  // Prefer the same-origin proxy so collection does not wait for public DNS.
  // Keep the configured origin as a fallback for deployments without the
  // rewrite used by this portfolio.
  const bases = ['/analytics-api']
  void (async () => {
    for (const base of bases) {
      try {
        const response = await send(base)
        if (response.ok) return
      } catch {
        // Try the next configured endpoint.
      }
    }
  })()
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ANALYTICS_API } from '@/lib/analytics'
import styles from '@/app/(site)/analytics/analytics.module.css'

type Range = '7d' | '30d' | '90d' | '365d' | 'all'
type Metric = {
  pageviews: number
  visitors: number
  sessions: number
  bounceRate: number
  intentRate: number
}
type DashboardData = {
  meta: {
    generatedAt: string
    startAt: string
    range: Range
    privacyThreshold: number
    hasData: boolean
  }
  stats: {
    current: Metric
    comparison: Record<keyof Metric, number | null>
  }
  realtime: {
    activeVisitors: number
    activeSessions: number
    eventsLast5Minutes: number
    lastEventAt: string | null
  }
  trend: Array<{ date: string; pageviews: number; visitors: number }>
  locations: Array<{ city: string | null; country: string; sessions: number; visitors: number; intentRate: number }>
  regions: Array<{ region: string; country: string; sessions: number }>
  cities: Array<{ city: string; region: string; country: string; sessions: number }>
  projects: Array<{ slug: string; views: number; visitors: number; engagementRate: number }>
  sources: Array<{ source: string; sessions: number; intentRate: number }>
  devices: Array<{ device: string; sessions: number }>
  funnel: Array<{ label: string; sessions: number }>
  insights: Array<{ title: string; body: string }>
}

const REFRESH_INTERVAL_MS = 5_000

const ranges: Array<{ value: Range; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '365d', label: '1y' },
  { value: 'all', label: 'All' },
]

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })

function labelSlug(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function locationLabel(city: string | null, country: string) {
  const countryName = countryNames.of(country) ?? country
  return `${city || 'City unavailable'}, ${countryName}`
}

function Change({ value, points = false }: { value: number | null; points?: boolean }) {
  if (value === null) return <span className={styles.changeMuted}>New</span>
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  return (
    <span className={styles.change} data-direction={direction}>
      {value > 0 ? '+' : ''}{value}{points ? 'pp' : '%'}
    </span>
  )
}

function TrendChart({ data }: { data: DashboardData['trend'] }) {
  if (data.length === 1) {
    const day = data[0]
    return (
      <div className={styles.singleDayTrend} role="img" aria-label={`${day.date}: ${day.pageviews} pageviews and ${day.visitors} visitors`}>
        <div>
          <span style={{ width: '100%' }} />
          <strong>{day.pageviews}</strong>
          <p>Pageviews</p>
        </div>
        <div>
          <span style={{ width: `${Math.max(8, day.visitors * 100 / Math.max(1, day.pageviews))}%` }} />
          <strong>{day.visitors}</strong>
          <p>Visitors</p>
        </div>
        <time dateTime={day.date}>{new Date(`${day.date}T00:00:00Z`).toLocaleDateString('en', { dateStyle: 'long', timeZone: 'UTC' })}</time>
      </div>
    )
  }

  const width = 900
  const height = 280
  const pad = 18
  const maximum = Math.max(1, ...data.flatMap((item) => [item.pageviews, item.visitors]))
  const x = (index: number) => pad + (index * (width - pad * 2)) / Math.max(1, data.length - 1)
  const y = (value: number) => height - pad - (value / maximum) * (height - pad * 2)
  const line = (key: 'pageviews' | 'visitors') =>
    data.map((item, index) => `${index ? 'L' : 'M'}${x(index)},${y(item[key])}`).join(' ')

  return (
    <div className={styles.chartWrap}>
      <svg className={styles.trendChart} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="traffic-title traffic-desc">
        <title id="traffic-title">Pageviews and visitors over time</title>
        <desc id="traffic-desc">Two-line traffic trend for the selected period.</desc>
        {[0.25, 0.5, 0.75].map((position) => (
          <line key={position} x1={pad} x2={width - pad} y1={height * position} y2={height * position} className={styles.gridLine} />
        ))}
        <path d={line('pageviews')} className={styles.pageviewLine} />
        <path d={line('visitors')} className={styles.visitorLine} />
        {data.map((item, index) => (
          <g key={item.date}>
            <circle cx={x(index)} cy={y(item.pageviews)} r="3.5" className={styles.pageviewDot} />
            <circle cx={x(index)} cy={y(item.visitors)} r="3.5" className={styles.visitorDot} />
            <circle cx={x(index)} cy={y(item.pageviews)} r="8" className={styles.hitArea}>
              <title>{item.date}: {item.pageviews} pageviews</title>
            </circle>
            <circle cx={x(index)} cy={y(item.visitors)} r="8" className={styles.hitArea}>
              <title>{item.date}: {item.visitors} visitors</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className={styles.legend} aria-hidden>
        <span><i data-series="pageviews" />Pageviews</span>
        <span><i data-series="visitors" />Visitors</span>
      </div>
    </div>
  )
}

function RankedBars({ rows, label, value }: {
  rows: Array<Record<string, string | number>>
  label: string
  value: string
}) {
  const maximum = Math.max(1, ...rows.map((row) => Number(row[value])))
  return (
    <div className={styles.bars}>
      {rows.map((row) => (
        <div className={styles.barRow} key={String(row[label])}>
          <span className={styles.barLabel}>{String(row[label])}</span>
          <span className={styles.barTrack}>
            <span className={styles.barFill} style={{ width: `${(Number(row[value]) / maximum) * 100}%` }} />
          </span>
          <strong>{compact.format(Number(row[value]))}</strong>
        </div>
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.skeletonWide} />
      <span className={styles.skeletonGrid} />
      <span>Loading verified analytics…</span>
    </div>
  )
}

export function AnalyticsDashboard({ projectSlugs }: { projectSlugs: string[] }) {
  const [range, setRange] = useState<Range>('30d')
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!ANALYTICS_API) {
      setError('Analytics API has not been configured yet.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const bases = Array.from(
        new Set(['/analytics-api'])
      )
      let response: Response | null = null
      for (const base of bases) {
        try {
          response = await fetch(`${base}/v1/public/dashboard?range=${range}`, {
            signal,
            credentials: 'omit',
            cache: 'no-store',
          })
          if (response.ok) break
        } catch (caught) {
          if ((caught as Error).name === 'AbortError') throw caught
        }
      }
      if (!response?.ok) throw new Error('Analytics endpoints unavailable')
      setData(await response.json() as DashboardData)
    } catch (caught) {
      if ((caught as Error).name !== 'AbortError') {
        setError('Live analytics are temporarily unavailable.')
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [range])

  useEffect(() => {
    let controller = new AbortController()
    let task = 0
    let stopped = false

    const refresh = async () => {
      controller.abort()
      controller = new AbortController()
      await load(controller.signal)
      if (!stopped) task = window.setTimeout(refresh, REFRESH_INTERVAL_MS)
    }

    const resume = () => {
      if (document.visibilityState !== 'visible') return
      window.clearTimeout(task)
      void refresh()
    }

    void refresh()
    document.addEventListener('visibilitychange', resume)
    return () => {
      stopped = true
      window.clearTimeout(task)
      controller.abort()
      document.removeEventListener('visibilitychange', resume)
    }
  }, [load])

  const deviceTotal = useMemo(
    () => data?.devices.reduce((sum, item) => sum + item.sessions, 0) ?? 0,
    [data]
  )

  const displayProjects = useMemo(() => {
    if (!data) return []
    const measured = new Map(data.projects.map((project) => [project.slug, project]))
    const baseline = projectSlugs.map((slug) => measured.get(slug) ?? {
      slug,
      views: 0,
      visitors: 0,
      engagementRate: 0,
    })
    const known = new Set(projectSlugs)
    return [...baseline, ...data.projects.filter((project) => !known.has(project.slug))]
  }, [data, projectSlugs])

  const displaySources = data?.sources.length
    ? data.sources
    : [{ source: 'Direct', sessions: 0, intentRate: 0 }]
  const displayDevices = useMemo(() => {
    if (!data) return []
    const measured = new Map(data.devices.map((item) => [item.device, item]))
    const defaults = ['Desktop', 'Mobile', 'Tablet'].map(
      (device) => measured.get(device) ?? { device, sessions: 0 }
    )
    const standard = new Set(['Desktop', 'Mobile', 'Tablet'])
    return [...defaults, ...data.devices.filter((item) => !standard.has(item.device))]
  }, [data])
  const displayInsights = data?.insights.length
    ? data.insights
    : [
        {
          title: 'Traffic baseline',
          body: `${data?.stats.current.pageviews ?? 0} verified pageviews from ${data?.stats.current.visitors ?? 0} visitors in this period.`,
        },
        {
          title: 'Location baseline',
          body: `${data?.locations.length ?? 0} city and country locations have reached the public privacy threshold.`,
        },
        {
          title: 'Intent baseline',
          body: `${data?.funnel.at(-1)?.sessions ?? 0} high-intent actions have been recorded in this period.`,
        },
      ]

  return (
    <div className={styles.root} aria-busy={loading}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Public data · privacy thresholded</p>
          <h1 className="display">Analytics</h1>
          <p className={styles.intro}>A transparent view of how this portfolio is discovered, read, and acted on.</p>
        </div>
        <div className={styles.headerControls}>
          <div className={styles.liveStatus} data-error={Boolean(error)} role="status" aria-live="polite">
            <i aria-hidden />
            <strong>{error ? 'Reconnecting' : 'Live'}</strong>
            <span>{loading && data ? 'Syncing…' : 'Updates every 5s'}</span>
          </div>
          <div className={styles.rangeGroup} aria-label="Analytics period">
            {ranges.map((item) => (
              <button
                key={item.value}
                type="button"
                className={styles.rangeButton}
                data-selected={range === item.value}
                aria-pressed={range === item.value}
                onClick={() => setRange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading && !data ? <LoadingState /> : error && !data ? (
        <section className={styles.message} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void load()}>Try again</button>
        </section>
      ) : data ? (
        <>
          <section className={styles.metricGrid} aria-label="Key metrics">
            <article className={styles.metric} data-live-metric>
              <span>Active now</span>
              <strong>{compact.format(data.realtime.activeVisitors)}</strong>
              <span className={styles.liveWindow}>Last 5 minutes</span>
            </article>
            {([
              ['Visitors', 'visitors', false],
              ['Pageviews', 'pageviews', false],
              ['Sessions', 'sessions', false],
              ['Intent rate', 'intentRate', true],
            ] as const).map(([label, key, percent]) => (
              <article className={styles.metric} key={key}>
                <span>{label}</span>
                <strong>{compact.format(data.stats.current[key])}{percent ? '%' : ''}</strong>
                <Change value={data.stats.comparison[key]} points={percent} />
              </article>
            ))}
          </section>

          {!data.meta.hasData && (
            <p className={styles.zeroNotice} role="status">
              Live collection is active. Every section shows a verified zero until real traffic arrives.
            </p>
          )}

          <section className={`${styles.panel} ${styles.traffic}`}>
            <div className={styles.sectionHead}>
              <div>
                <span className={styles.sectionIndex}>01</span>
                <h2>Traffic rhythm</h2>
              </div>
              <p>Daily UTC · compared with the preceding period</p>
            </div>
            <TrendChart data={data.trend} />
          </section>

          <div className={styles.twoColumn}>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <div><span className={styles.sectionIndex}>02</span><h2>Audience location</h2></div>
                <p>City, country · at least {data.meta.privacyThreshold} sessions</p>
              </div>
              {data.locations.length ? (
                <>
                  <RankedBars
                    rows={data.locations.map((item) => ({
                      location: locationLabel(item.city, item.country),
                      sessions: item.sessions,
                    }))}
                    label="location"
                    value="sessions"
                  />
                </>
              ) : (
                <RankedBars rows={[{ location: 'No public city yet', sessions: 0 }]} label="location" value="sessions" />
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <div><span className={styles.sectionIndex}>03</span><h2>Acquisition quality</h2></div>
                <p>Sessions and the actions they produce</p>
              </div>
              <div className={styles.dataRows}>
                {displaySources.slice(0, 7).map((item) => (
                  <div className={styles.dataRow} key={item.source}>
                    <span>{item.source}</span>
                    <strong>{item.sessions}</strong>
                    <em>{item.intentRate}% intent</em>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className={styles.panel}>
            <div className={styles.sectionHead}>
              <div><span className={styles.sectionIndex}>04</span><h2>Project attention</h2></div>
              <p>Views are useful; sustained reading is the stronger signal</p>
            </div>
            <div className={styles.projectTable} role="table" aria-label="Project analytics">
              <div className={styles.projectHead} role="row">
                <span>Project</span><span>Views</span><span>Visitors</span><span>Read 75%</span>
              </div>
              {displayProjects.map((project) => (
                <div className={styles.projectRow} role="row" key={project.slug}>
                  <strong>{labelSlug(project.slug)}</strong>
                  <span data-label="Views">{project.views}</span>
                  <span data-label="Visitors">{project.visitors}</span>
                  <span data-label="Read 75%">{project.engagementRate}%</span>
                </div>
              ))}
            </div>
          </section>

          <div className={styles.twoColumn}>
            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <div><span className={styles.sectionIndex}>05</span><h2>Intent funnel</h2></div>
                <p>From arrival to a meaningful next step</p>
              </div>
              <div className={styles.funnel}>
                {data.funnel.map((step, index) => {
                  const base = Math.max(1, data.funnel[0]?.sessions ?? 1)
                  return (
                    <div className={styles.funnelStep} key={step.label}>
                      <span className={styles.funnelBar} style={{ width: `${step.sessions ? Math.max(12, step.sessions * 100 / base) : 0}%` }} />
                      <span>{step.label}</span>
                      <strong>{step.sessions}</strong>
                      {index > 0 && <em>{Math.round(step.sessions * 100 / base)}%</em>}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <div><span className={styles.sectionIndex}>06</span><h2>Device mix</h2></div>
                <p>Where the reading experience has to work</p>
              </div>
              <div className={styles.deviceList}>
                {displayDevices.map((item) => (
                  <div key={item.device}>
                    <span>{item.device}</span>
                    <strong>{deviceTotal ? Math.round(item.sessions * 100 / deviceTotal) : 0}%</strong>
                    <i><span style={{ width: `${deviceTotal ? item.sessions * 100 / deviceTotal : 0}%` }} /></i>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className={`${styles.panel} ${styles.insights}`}>
            <div className={styles.sectionHead}>
              <div><span className={styles.sectionIndex}>07</span><h2>What the data says</h2></div>
              <p>Generated only after 30 sessions</p>
            </div>
            <div className={styles.insightGrid}>
              {displayInsights.map((insight) => (
                <article key={insight.title}><span>{data.insights.length ? 'Signal' : 'Baseline'}</span><h3>{insight.title}</h3><p>{insight.body}</p></article>
              ))}
            </div>
          </section>

          <footer className={styles.dataNote}>
            <p>No cookies, raw IP addresses, form contents, or individual sessions are published.</p>
            <p>Live · updated {new Date(data.meta.generatedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' })} UTC.</p>
          </footer>
        </>
      ) : null}
    </div>
  )
}

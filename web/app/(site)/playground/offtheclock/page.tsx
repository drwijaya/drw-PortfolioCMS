import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/PageHeader'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { IslandLoader } from '@/components/off-the-clock/IslandLoader'
import { PixelEmblem } from '@/components/off-the-clock/Collection'
import { BackIcon, OffTheClockBreadcrumb } from '@/components/off-the-clock/Navigation'
import { ROOM_IDS, rooms } from '@/content/off-the-clock'
import styles from '@/components/off-the-clock/OffTheClock.module.css'

export const metadata: Metadata = {
  title: 'Off the Clock',
  description: 'Explore a little pixel island for David’s homelab, music, films, and games. A few favorite things, outside of work.',
  alternates: { canonical: '/playground/offtheclock' },
  openGraph: { title: 'Off the Clock · David Rizky Wijaya', description: 'A little island. A few favorite things. Explore homelab, music, film, and games.', url: '/playground/offtheclock', images: [{ url: '/img/off-the-clock/island-social.png', width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'Off the Clock', description: 'A little pixel island for life outside work.', images: ['/img/off-the-clock/island-social.png'] },
}

export default function OffTheClockPage() {
  return <div className={styles.page}>
    <PageHeader
      label="Off the Clock"
      breadcrumb={
        <>
          <TransitionLink
            href="/playground"
            className={`${styles.iconLink} ${styles.pageBack}`}
            aria-label="Back to Playground"
            title="Back to Playground"
          >
            <BackIcon />
          </TransitionLink>
          <OffTheClockBreadcrumb />
        </>
      }
      as="h1"
      first
    />
    <div className={styles.intro}>
      <p><strong>A little life outside of work.</strong>A small island for my homelab, music, films, and games. Come wander. Every door is open.</p>
      <a href="#collections" className={styles.textLink}>Browse collections ↓</a>
    </div>
    <IslandLoader />
    <section id="collections" className={styles.collectionIndex} aria-labelledby="collections-title">
      <div className={styles.sectionLine}><h2 id="collections-title">Four places to get to know me</h2><span>No walking required</span></div>
      <div className={styles.destinations}>{ROOM_IDS.map(id => <TransitionLink key={id} href={`/playground/offtheclock/${id}`} className={styles.destination}>
        <PixelEmblem room={id} /><div><h3>{rooms[id].name} ↗</h3><span>{rooms[id].place}</span></div>
      </TransitionLink>)}</div>
      <p className={styles.footnote}>Twelve favorites, one small homelab, and journals for the things I discover along the way.</p>
    </section>
  </div>
}

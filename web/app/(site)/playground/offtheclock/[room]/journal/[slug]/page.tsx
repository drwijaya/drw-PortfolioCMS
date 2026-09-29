import { JournalBody } from '@/components/off-the-clock/GameNotebook'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BackIcon, RoomBreadcrumb } from '@/components/off-the-clock/Navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { journals, journalCopy, isMediaRoom, MEDIA_ROOMS } from '@/content/off-the-clock'
import styles from '@/components/off-the-clock/OffTheClock.module.css'

export function generateStaticParams() { return MEDIA_ROOMS.flatMap(room => journals[room].map(({ slug }) => ({ room, slug }))) }
export async function generateMetadata({ params }: { params: Promise<{ room: string; slug: string }> }): Promise<Metadata> {
  const { room, slug } = await params
  if (!isMediaRoom(room)) notFound()
  const entry = journals[room].find(e => e.slug === slug)
  if (!entry) return {}
  return { title: `${entry.title} · ${journalCopy[room].title}`, description: entry.excerpt, alternates: { canonical: `/playground/offtheclock/${room}/journal/${slug}` },
    openGraph: { type: 'article', title: entry.title, description: entry.excerpt, url: `/playground/offtheclock/${room}/journal/${slug}`, images: ['/img/off-the-clock/island-social.png'] },
    twitter: { card: 'summary_large_image', title: entry.title, description: entry.excerpt, images: ['/img/off-the-clock/island-social.png'] } }
}
export default async function JournalPage({ params }: { params: Promise<{ room: string; slug: string }> }) {
  const { room, slug } = await params
  if (!isMediaRoom(room)) notFound()
  const entry = journals[room].find(e => e.slug === slug)
  if (!entry) notFound()
  return <div className={styles.page}>
    <PageHeader label={entry.title} breadcrumb={<RoomBreadcrumb room={room} journal={entry.title} />} as="h1" first actions={<TransitionLink href={`/playground/offtheclock/${room}`} className={`${styles.iconLink} ${styles.pageBack}`} aria-label={`Back to ${room}`} title={`Back to ${room}`}><BackIcon /></TransitionLink>} />
    <article className={styles.article}><h2 className="display">{journalCopy[room].heading}</h2><JournalBody entry={entry}/>
    </article>
  </div>
}

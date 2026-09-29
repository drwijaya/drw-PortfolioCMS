import { collectionRooms } from '@/lib/cms/collections'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { BackIcon, RoomBreadcrumb } from '@/components/off-the-clock/Navigation'
import { Collection } from '@/components/off-the-clock/Collection'
import { isRoom, ROOM_IDS } from '@/content/off-the-clock'
import styles from '@/components/off-the-clock/OffTheClock.module.css'

export function generateStaticParams() { return ROOM_IDS.map(room => ({ room })) }
export async function generateMetadata({ params }: { params: Promise<{ room: string }> }): Promise<Metadata> {
  const { room } = await params
  if (!isRoom(room)) return {}
  const data = (await collectionRooms())[room]
  return { title: `${data.name} · Off the Clock`, description: data.description, alternates: { canonical: `/playground/offtheclock/${room}` },
    openGraph: { title: `${data.name} · Off the Clock`, description: data.description, url: `/playground/offtheclock/${room}`, images: ['/img/off-the-clock/island-social.png'] },
    twitter: { card: 'summary_large_image', title: `${data.name} · Off the Clock`, description: data.description, images: ['/img/off-the-clock/island-social.png'] } }
}
export default async function CollectionPage({ params }: { params: Promise<{ room: string }> }) {
  const { room } = await params
  if (!isRoom(room)) notFound()
  const data = (await collectionRooms())[room]
  return <div className={styles.page}>
    <PageHeader
      label={data.name}
      breadcrumb={
        <>
          <TransitionLink
            href="/playground/offtheclock"
            className={`${styles.iconLink} ${styles.pageBack}`}
            aria-label="Back to Off the Clock"
            title="Back to Off the Clock"
          >
            <BackIcon />
          </TransitionLink>
          <RoomBreadcrumb room={room} />
        </>
      }
      as="h1"
      first
      actions={
        <TransitionLink href={`/playground/offtheclock#${room}`} className={styles.textLink}>
          Explore the room ↗
        </TransitionLink>
      }
    />
    <div className={styles.collectionHeading}><span className={styles.eyebrow}>{data.eyebrow}</span><h2 className="display">{data.place}</h2><p>{data.description}</p></div>
    <Collection room={room} />
  </div>
}

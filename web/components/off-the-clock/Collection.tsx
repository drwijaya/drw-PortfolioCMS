'use client'
import { useRooms } from './CollectionData'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { journals, journalCopy, mediaFormats, homelab, type RoomId, type MediaRoom } from '@/content/off-the-clock'
import styles from './OffTheClock.module.css'
import { MediaArtwork } from './MediaArtwork'

export function PixelEmblem({ room, index = 0 }: { room: RoomId; index?: number }) {
  return (
    <svg viewBox="0 0 80 80" fill="none" shapeRendering="crispEdges" aria-hidden="true" className={styles.emblem}>
      {room === 'music' ? <>
        <path d="M26 10h28v6h10v10h6v28h-6v10H54v6H26v-6H16V54h-6V26h6V16h10Z" fill="currentColor" />
        <path d="M28 20h24v4H28zM20 28h4v24h-4zM28 56h24v4H28zM56 28h4v24h-4z" fill="var(--otc-mid)" />
        <path d="M32 28h16v4h4v16h-4v4H32v-4h-4V32h4Z" fill="var(--otc-paper)" /><path d="M37 37h6v6h-6z" fill="var(--otc-accent)" />
      </> : room === 'film' ? <>
        <path d="M15 9h50v62H15z" fill="currentColor" /><path d="M27 15h26v50H27z" fill="var(--otc-paper)" />
        {[18, 31, 44, 57].map(y => <path key={y} d={`M19 ${y}h4v6h-4zM57 ${y}h4v6h-4z`} fill="var(--otc-mid)" />)}
        <path d={index % 2 ? 'M31 48h18v12H31zM34 25h12v23H34z' : 'M30 49h20v11H30zM34 40h12v9H34zM37 30h6v10h-6z'} fill="var(--otc-accent)" />
      </> : room === 'games' ? <>
        <path d="M20 8h40v35h5v12h-5v17H20V55h-5V43h5z" fill="currentColor" />
        <path d="M25 13h30v6H25zM25 25h30v20H25zM20 49h40v6H20z" fill="var(--otc-mid)" />
        <path d="M29 29h22v12H29zM25 59h30v9H25z" fill="var(--otc-accent)" /><path d="M28 46h3v8h-3zM48 50h5v3h-5z" fill="currentColor" />
      </> : <>
        <path d="M18 8h44v64H18z" fill="currentColor" />
        {[14, 32, 50].map(y => <g key={y}><path d={`M23 ${y}h34v14H23z`} fill="var(--otc-mid)" /><path d={`M28 ${y + 5}h4v4h-4z`} fill="var(--otc-accent)" /><path d={`M38 ${y + 6}h14v2H38z`} fill="currentColor" /></g>)}
      </>}
    </svg>
  )
}

export function JournalList({ room }: { room: MediaRoom }) {
  const entries = journals[room]
  const copy = journalCopy[room]
  return <section className={styles.journal} aria-label={copy.title}>
    <div className={styles.sectionLine}><h3>{copy.title}</h3><span>{entries.length ? `${entries.length} entries` : 'An open notebook'}</span></div>
    {entries.length ? entries.map(entry => <TransitionLink key={entry.slug} href={`/playground/offtheclock/${room}/journal/${entry.slug}`} className={styles.journalRow}>
      <time dateTime={entry.date}>{entry.date}</time><div><h4>{entry.title}</h4><p>{entry.excerpt}</p></div><span aria-hidden>↗</span>
    </TransitionLink>) : <p className={styles.emptyNote}>{copy.empty}</p>}
  </section>
}

export function Collection({ room, selected }: { room: RoomId; selected?: number }) {
  const rooms=useRooms()
  const data = rooms[room]
  if (room === 'homelab') return <div>
    {homelab.sections.length ? <div className={styles.setup}>
      {homelab.updated && <p className={styles.eyebrow}>Updated {homelab.updated}</p>}
      {(selected === undefined ? homelab.sections : homelab.sections.slice(selected, selected + 1)).map(section => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}
    </div> : <div className={styles.labEmpty}>
      <PixelEmblem room="homelab" /><div><h3>On the workbench</h3><p>{data.empty}</p><span className={styles.small}>Setup details coming soon</span></div>
    </div>}
  </div>
  const slots = selected === undefined ? [0, 1, 2, 3] : [selected]
  return <>
    {!data.favorites.length && <p className={styles.emptyNote}>{data.empty}</p>}
    <div className={`${styles.shelves} ${selected !== undefined ? styles.singleShelf : ''}`} data-room={room}>
      {slots.map(i => {
        const item = data.favorites[i]
        return <article key={i} className={styles.favorite}>
          <div className={styles.cover} style={{ aspectRatio: mediaFormats[room].ratio }}>
            <MediaArtwork room={room} item={item} />
            <span className={styles.coverNumber}>{String(i + 1).padStart(2, '0')}</span>
          </div>
          <h3>{item?.title ?? (room === 'music' ? 'A record to come' : room === 'film' ? 'A film to come' : 'A game to come')}</h3>
          <span className={styles.small}>{item ? [item.creator, item.year].filter(Boolean).join(' · ') : 'The collection is coming soon'}</span>
          {item?.note && <p>{item.note}</p>}
          {item?.link && <a className={styles.textLink} href={item.link} target="_blank" rel="noopener noreferrer">{room === 'music' ? 'Listen' : 'Find out more'} ↗</a>}
        </article>
      })}
    </div>
    {selected === undefined && <JournalList room={room} />}
  </>
}

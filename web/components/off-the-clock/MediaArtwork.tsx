'use client'

import Image from '@/components/cms/ContentImage'
import { useId, useState, type CSSProperties } from 'react'
import { mediaFormats, type Favorite, type MediaRoom } from '@/content/off-the-clock'
import styles from './OffTheClock.module.css'

/** The same replaceable image and classic treatment in a room or a collection. */
export function MediaArtwork({ room, item, eager = false }: { room: MediaRoom; item?: Favorite; eager?: boolean }) {
  const id = useId().replace(/:/g, '')
  const [failedSource, setFailedSource] = useState<string>()
  const src = item?.artwork
  return <span className={styles.mediaArtwork} data-display={item?.display ?? mediaFormats[room].display}
    style={{ '--media-light': `url('#${id}-light')`, '--media-dark': `url('#${id}-dark')` } as CSSProperties}>
    <svg width="0" height="0" className={styles.paletteFilters} aria-hidden="true"><defs>
      <filter id={`${id}-light`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" /><feComponentTransfer>
          <feFuncR type="discrete" tableValues="0.1804 0.6118 0.8902 1" />
          <feFuncG type="discrete" tableValues="0.1647 0.3451 0.8314 0.9451" />
          <feFuncB type="discrete" tableValues="0.1490 0.2 0.7412 0.9176" />
        </feComponentTransfer>
      </filter>
      <filter id={`${id}-dark`} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" /><feComponentTransfer>
          <feFuncR type="discrete" tableValues="0.1098 0.2471 0.8510 0.9490" />
          <feFuncG type="discrete" tableValues="0.0745 0.1804 0.5412 0.9255" />
          <feFuncB type="discrete" tableValues="0.0627 0.1373 0.3608 0.8902" />
        </feComponentTransfer>
      </filter>
    </defs></svg>
    {src && failedSource !== src ? <Image key={src} src={src} alt={item?.artworkAlt ?? `${item?.title} cover`}
      fill sizes="(max-width: 679px) 45vw, 240px" loading={eager ? 'eager' : 'lazy'} className={styles.mediaImage}
      style={{ objectFit: item?.artworkFit ?? 'contain', objectPosition: item?.artworkPosition ?? 'center' }}
      onError={() => setFailedSource(src)} /> : <span className={styles.artworkFallback} role="img" aria-label={`${item?.title ?? 'Favorite'} — artwork unavailable`}>
        <span aria-hidden>◇</span><span>{item?.title ?? 'A favorite to come'}</span>
      </span>}
  </span>
}

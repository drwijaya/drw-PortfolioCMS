'use client'

import Image from '@/components/cms/ContentImage'
import { useEffect, useRef, useState } from 'react'

export function FigureImage({ src, alt, caption, width, height, preload = false }: {
  src: string
  alt: string
  caption?: string
  width: number
  height: number
  preload?: boolean
}) {
  const ref = useRef<HTMLImageElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    // Cached images can finish before React attaches the load handler.
    const frame = requestAnimationFrame(() => {
      if (ref.current?.complete) setStatus(ref.current.naturalWidth ? 'ready' : 'error')
    })
    return () => cancelAnimationFrame(frame)
  }, [src])

  return (
    <>
      <Image
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        preload={preload}
        quality={90}
        sizes={src.endsWith('/reflective-mark.png') ? '300px' : '(max-width: 899px) 100vw, 820px'}
        className="cs-figure-img"
        data-zoom={src}
        data-zoom-caption={caption ?? ''}
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
      />
      <div className="cs-image-status" data-image-status={status} hidden={status === 'ready'} role="status">
        <span className="cs-image-spinner" aria-hidden="true" hidden={status !== 'loading'} />
        <span>{status === 'error' ? 'Image could not load.' : 'Loading image…'}</span>
        {status === 'error' && <a href={src} target="_blank" rel="noopener noreferrer">Open original image</a>}
      </div>
      <noscript><style>{'.cs-image-status { display: none; }'}</style></noscript>
    </>
  )
}

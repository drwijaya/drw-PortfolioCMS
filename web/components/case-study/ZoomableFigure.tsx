import { FigureImage } from './FigureImage'

import { sizeOf } from '@/content/image-sizes'

/**
 * Renders exactly the DOM that partials/case_study.html emitted, because
 * the ported controller finds `.cs-figure-frame` itself and attaches the
 * wheel-zoom, pointer-pan and lightbox handlers to it. This component is
 * markup around a small client image component that reports loading/errors.
 *
 * `data-zoom` points at the untouched original so the lightbox always has
 * full resolution to zoom into, whatever variant next/image served inline.
 */
export function ZoomableFigure({
  src,
  alt,
  caption,
  plate = false,
  preload = false,
}: {
  src: string
  alt: string
  caption?: string
  plate?: boolean
  preload?: boolean
}) {
  const { width, height } = sizeOf(src)

  return (
    <div className={`cs-figure-frame${plate ? ' has-plate' : ''}`}>
      <FigureImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        caption={caption}
        preload={preload}
      />
      <div className="cs-zoom-ui is-compact" data-inline-zoom-ui>
        <button
          type="button"
          className="cs-zoom-btn"
          data-zoom-act="out"
          aria-label="Zoom out"
          title="Zoom out"
          disabled
        >
          −
        </button>
        <button
          type="button"
          className="cs-zoom-reset cs-zoom-level"
          data-zoom-act="reset"
          data-zoom-level
          aria-label="Reset zoom"
          title="Reset zoom"
          disabled
        >
          100%
        </button>
        <button
          type="button"
          className="cs-zoom-btn"
          data-zoom-act="in"
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
      </div>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="cs-figure-zoom"
        aria-label="Enlarge figure"
        title="Enlarge figure"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden>
          <path d="M3 3h7v2H5v5H3zm11 0h7v7h-2V5h-5zM5 14v5h5v2H3v-7zm14 0h2v7h-7v-2h5z" />
        </svg>
      </a>
    </div>
  )
}

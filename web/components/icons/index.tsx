// Inline SVG. Replaces the Font Awesome CDN stylesheet the Flask build
// loaded for roughly six glyphs.
//
// The brand marks (LinkedIn/GitHub/Instagram/Mail) and the drw glyph were
// removed when the sidebar pills became text-only. They are in git history
// at b4ad9dd if they are ever needed again.
//
// MetaIcon and its twelve semantic paths went the same way: the case-study
// byline reads "Role / Team / Timeline / Project type" and every callout
// title names its own kind, so a glyph beside either was saying a vaguer
// second version of the label next to it. Buttons and navigation keep their
// icons; it was only the document's own copy that had them twice.

import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = (p: P) => ({
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true as const,
  focusable: 'false' as const,
  ...p,
})

export function Sun(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-13a1 1 0 0 1-1-1V2a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1zm0 18a1 1 0 0 1-1-1v-1a1 1 0 1 1 2 0v1a1 1 0 0 1-1 1zM4 13H3a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2zm17 0h-1a1 1 0 1 1 0-2h1a1 1 0 1 1 0 2zM5.6 6.99 4.9 6.28a1 1 0 0 1 1.42-1.42l.7.71A1 1 0 1 1 5.6 7zm12.7 12.72-.7-.71a1 1 0 1 1 1.4-1.42l.72.71a1 1 0 0 1-1.42 1.42zM6.3 19.71a1 1 0 0 1-1.41-1.42l.7-.71a1 1 0 1 1 1.42 1.42zM17.6 7a1 1 0 0 1-.7-1.71l.7-.71a1 1 0 1 1 1.42 1.42l-.71.7a1 1 0 0 1-.71.3z" />
    </svg>
  )
}

export function Moon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.4A7 7 0 0 1 12 3z" />
    </svg>
  )
}

/** The dock's disclosure. Points up when the drawer is shut; the button
 *  rotates it rather than swapping the glyph, so the state is one property. */
export function ChevronUp(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  )
}

export function LinkIcon(p: P) {
  return (
    <svg {...base(p)}>
      <path d="M3.9 12c0-1.16.94-2.1 2.1-2.1h4V8H6a4 4 0 0 0 0 8h4v-1.9H6A2.1 2.1 0 0 1 3.9 12zM7 13h10v-2H7v2zm11-5h-4v1.9h4a2.1 2.1 0 1 1 0 4.2h-4V16h4a4 4 0 0 0 0-8z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// The nav data, in a module with no 'use client' on it.
//
// This lives apart from PrimaryNav.tsx for one reason. PrimaryNav is a client
// component, and Sidebar.tsx is a server component that needs MENU.length to
// number the social pills. A server component importing a named export from a
// client module receives a client-reference proxy rather than the value, so
// `MENU.length` came back undefined, `undefined + i` gave NaN, and every
// social pill rendered an empty numeral. The primary pills were fine, because
// PrimaryNav reads ROMAN on the client side of the same boundary.
//
// Plain data crossing that boundary belongs in a plain module. Keep it here.
// ─────────────────────────────────────────────────────────────────────────
import type { TabKey } from '@/lib/tab-memory'

/** The sequence runs unbroken across the primary and social groups, the way
 *  a printed index would, so the socials continue where the menu leaves off. */
export const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix']

export const MENU = [
  {
    href: '/works',
    label: 'Works',
    tab: 'works' as TabKey,
    // `/` redirects here, so the pill stays lit for the bare domain too.
    activePaths: ['/works', '/'],
  },
  {
    href: '/playground',
    label: 'Playground',
    tab: 'playground' as TabKey,
    activePaths: ['/playground'],
  },
  {
    href: '/about',
    label: 'About',
    tab: 'about' as TabKey,
    activePaths: ['/about'],
  },
  {
    href: '/contact',
    label: 'Contact',
    tab: 'contact' as TabKey,
    activePaths: ['/contact'],
  },
] as const

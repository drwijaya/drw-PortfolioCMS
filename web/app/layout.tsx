import { headers } from "next/headers";
import { readDocument,siteSettings } from '@/lib/cms/read'
import { paletteCss } from '@/lib/cms/palette'
import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import localFont from 'next/font/local'

import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { getProfile } from '@/lib/content'
import { siteOrigin } from '@/lib/site-url'
import './globals.css'

export const dynamic = 'force-dynamic'

// Self-hosted, subsetted to Latin, zero layout shift, no CDN.
// Variable on one axis (wght 400-600), so a headline can take weight
// without a second file.
const ricordi = localFont({
  src: '../public/fonts/tt-ricordi-greto.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '400 600',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  adjustFontFallback: 'Times New Roman',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile()
  const settings=await siteSettings()
  return {
    metadataBase: new URL(siteOrigin),
    title: {
      default: settings?.siteTitle&&settings.siteTitle!==profile.fullName?String(settings.siteTitle):`${profile.fullName} · ${profile.roleTitle}`,
      template: `%s · ${profile.fullName}`,
    },
    description: String(settings?.description ?? profile.shortBio),
    icons: { icon: String(settings?.favicon ?? '/img/favicon-mark.png') },
    openGraph: {
      type: 'website',
      siteName: String(settings?.siteTitle??profile.fullName),
      title: profile.fullName,
      description: profile.shortBio,
    },
    twitter: { card: 'summary_large_image',...(settings?.ogImage?{images:[String(settings.ogImage)]}:{}) },
  }
}

export const viewport: Viewport = {
  // Without this, env(safe-area-inset-*) resolves to 0 on every iPhone and
  // the dock sits under the home indicator. It is the switch that makes the
  // safe-area maths in globals.css mean anything.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFF1EA' },
    { media: '(prefers-color-scheme: dark)', color: '#1C1310' },
  ],
}

export default async function RootLayout({children}:{children:React.ReactNode}) {
 const palette=await readDocument('appearance','active')
 const previewTheme=(await headers()).get('x-cms-preview-theme') ?? undefined
 return <html lang="en" suppressHydrationWarning className={`${ricordi.variable} ${montserrat.variable}`}><body>{palette&&<style id="cms-palette">{paletteCss(palette.data)}</style>}<ThemeProvider forcedTheme={previewTheme}>{children}</ThemeProvider></body></html>
}

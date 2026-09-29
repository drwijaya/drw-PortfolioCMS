import type { NextConfig } from 'next'

/**
 * Cloudflare injects its Web Analytics beacon at the EDGE, so it is nowhere
 * in the origin HTML and nothing local can see it: the first build with a
 * CSP passed every check and then blocked the beacon the moment it went
 * through the tunnel. Two hosts, because the script and the endpoint it
 * reports to are different: `beacon.min.js` is served from `static.`, and
 * the measurements are POSTed to the apex.
 *
 * This is the only third-party origin on the list, and it is a deliberate
 * loosening rather than an oversight. Drop both entries the day Web
 * Analytics is switched off in the Cloudflare dashboard, or the policy will
 * be advertising a hole nothing uses.
 */
const CLOUDFLARE_BEACON = 'https://static.cloudflareinsights.com'
const CLOUDFLARE_RUM = 'https://cloudflareinsights.com'
const ANALYTICS_API =
  process.env.NEXT_PUBLIC_ANALYTICS_API_URL ?? 'https://api.davidrwijaya.site'
const isProduction = process.env.NODE_ENV === 'production'
const isSecureDeployment =
  isProduction && process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isProduction ? '' : " 'unsafe-eval'"} ${CLOUDFLARE_BEACON}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${CLOUDFLARE_RUM} ${ANALYTICS_API}${isProduction ? '' : ' ws: wss:'}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isSecureDeployment ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value:
      'accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  },
  ...(isSecureDeployment
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000',
        },
      ]
    : []),
]

const config: NextConfig = {
  // Local previews can opt into a writable cache when an existing `.next`
  // directory belongs to another runtime user.
  distDir: process.env.PORTFOLIO_NEXT_DIST_DIR || '.next',
  // Self-hosted: emit a minimal server bundle for the Docker image.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [420, 640, 900, 1200, 1600, 1920],
    imageSizes: [64, 96, 128, 280, 380],
    qualities: [75, 90],
    minimumCacheTTL: 86_400,
  },
  async redirects() {
    return [
      {
        source: '/off-the-clock/:path*',
        destination: '/playground/offtheclock/:path*',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return []
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/admin/preview/:path*',
        headers: [{ key: 'Content-Security-Policy', value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") + "; frame-src 'self'" }, { key: 'X-Frame-Options', value: 'SAMEORIGIN' }, { key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/playground/offtheclock/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy.replace(CLOUDFLARE_BEACON, `${CLOUDFLARE_BEACON} https://www.youtube.com https://s.ytimg.com`) + '; frame-src https://www.youtube-nocookie.com https://www.youtube.com' },
          { key: 'Permissions-Policy', value: 'accelerometer=(), autoplay=(self "https://www.youtube-nocookie.com" "https://www.youtube.com"), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()' },
        ],
      },
      {
        source: '/playground/offtheclock/booth',
        headers: [
          { key: 'Content-Security-Policy', value: "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src blob: data:; media-src blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()' },
          { key: 'Cache-Control', value: 'no-store, no-transform' },
        ],
      },
    ]
  },
}

export default config

// Use the public origin for metadata even if the deployment omits its URL
// setting. Local development retains localhost unless explicitly configured.
const fallback =
  process.env.NODE_ENV === 'production'
    ? 'https://davidrwijaya.site'
    : 'http://localhost:3000'

export const siteOrigin = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || fallback
).origin

import { redirect } from 'next/navigation'
import { siteSettings } from '@/lib/cms/read'

/**
 * There is no landing page any more; the work index is the front door.
 * Kept as a redirect so old links, bookmarks, and the bare domain still
 * resolve. The fragment of legacy `/#…` links survives the hop and is
 * migrated on /works by <LegacyHashRedirect />.
 */
export default async function RootPage() {
  redirect(String((await siteSettings())?.home ?? '/works'))
}

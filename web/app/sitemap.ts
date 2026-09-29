import { cmsEnabled } from '@/lib/cms/db'
export const dynamic='force-dynamic'
import { readDocuments } from '@/lib/cms/read'
import type { MetadataRoute } from 'next'

import { getProjectSlugs } from '@/lib/content'
import { siteOrigin } from '@/lib/site-url'
import { ROOM_IDS, MEDIA_ROOMS, journals } from '@/content/off-the-clock'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getProjectSlugs()
  const [posts,pages]=await Promise.all([readDocuments('post'),readDocuments('page')])

  const works=await readDocuments('work')
  const result:MetadataRoute.Sitemap= [
    ...posts.filter(d=>!d.seo.noindex).map(d=>({url:`${siteOrigin}/blog/${d.slug}`,priority:0.5})),
    ...pages.filter(d=>!d.seo.noindex&&d.data.visible!==false&&!['works','about','playground','contact'].includes(d.slug)).map(d=>({url:`${siteOrigin}/${d.slug}`,priority:0.5})),
    // `/` only redirects to the work index, so the index is the canonical
    // entry point.
    { url: `${siteOrigin}/works`, priority: 1 },
    { url: `${siteOrigin}/about`, priority: 0.7 },
    { url: `${siteOrigin}/playground`, priority: 0.7 },
    { url: `${siteOrigin}/playground/offtheclock`, priority: 0.6 },
    ...ROOM_IDS.map(room => ({ url: `${siteOrigin}/playground/offtheclock/${room}`, priority: 0.5 })),
    ...MEDIA_ROOMS.flatMap(room => journals[room].map(entry => ({ url: `${siteOrigin}/playground/offtheclock/${room}/journal/${entry.slug}`, priority: 0.4 }))),
    { url: `${siteOrigin}/contact`, priority: 0.6 },
    ...slugs.filter(slug=>!works.find(w=>w.slug===slug)?.seo.noindex).map((slug) => ({
      url: `${siteOrigin}/works/${slug}`,
      priority: 0.8,
    })),
  ]
  if(!cmsEnabled())return result
  return result.filter(item=>{const slug=new URL(item.url).pathname.slice(1);if(!['works','about','contact','playground'].includes(slug))return true;const page=pages.find(p=>p.slug===slug);return page&&!page.seo.noindex&&page.data.visible!==false})
}

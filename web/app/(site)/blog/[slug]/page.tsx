import { notFound,permanentRedirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db,cmsEnabled } from '@/lib/cms/db'
import { redirects } from '@/lib/cms/db-schema'
import { readDocument } from '@/lib/cms/read'
import { DocumentRenderer } from '@/components/cms/DocumentRenderer'
import { documentMetadata } from '@/lib/cms/metadata'
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const doc=await readDocument('post',slug);return doc?documentMetadata(doc):{}}
export default async function Post({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const doc=await readDocument('post',slug);if(!doc){if(cmsEnabled()){const [r]=await db().select().from(redirects).where(eq(redirects.source,`/blog/${slug}`));if(r)permanentRedirect(r.destination)}notFound()}return <DocumentRenderer document={doc}/>}

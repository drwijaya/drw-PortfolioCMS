import { notFound,permanentRedirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db,cmsEnabled } from '@/lib/cms/db'
import { redirects } from '@/lib/cms/db-schema'
import { readDocument } from '@/lib/cms/read'
import { DocumentRenderer } from '@/components/cms/DocumentRenderer'
import { documentMetadata } from '@/lib/cms/metadata'
export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const doc=await readDocument('page',slug.join('/'));return doc?documentMetadata(doc):{}}
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const path=slug.join('/');const doc=await readDocument('page',path);if(!doc){if(cmsEnabled()){const [r]=await db().select().from(redirects).where(eq(redirects.source,`/${path}`));if(r)permanentRedirect(r.destination)}notFound()}if(doc.data.visible===false)notFound();return <DocumentRenderer document={doc}/>}

import { PageHeader } from '@/components/ui/PageHeader'
import { BlogListing } from '@/components/cms/DocumentRenderer'
export const metadata={title:'Blog',description:'Notes, ideas, and things I am learning.',alternates:{canonical:'/blog'}}
export default async function Blog({searchParams}:{searchParams:Promise<{page?:string;category?:string;tag?:string}>}){const query=await searchParams;return <><PageHeader first as="h1" label="Blog"/><BlogListing page={Number(query.page)||1} category={query.category} tag={query.tag}/></>}

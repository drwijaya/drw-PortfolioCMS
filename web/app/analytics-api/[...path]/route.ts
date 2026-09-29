import { analyticsRequest } from '@/lib/cms/analytics-proxy'
export async function GET(request:Request,{params}:{params:Promise<{path:string[]}>}){try{return await analyticsRequest(request,(await params).path)}catch{return Response.json({error:'Analytics unavailable'},{status:503})}}
export const POST=GET

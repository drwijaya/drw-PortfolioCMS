import { NextRequest } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const service = process.env.PANTRY_API_URL || 'http://game-api:8081'
async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  if (!path.every(p => /^[a-zA-Z0-9-]+$/.test(p))) return Response.json({error:'Not found.'},{status:404})
  const method=request.method
  let sameOrigin = request.headers.get('origin') === process.env.NEXT_PUBLIC_SITE_URL
  try {
    const source = new URL(request.headers.get('origin') || '')
    sameOrigin ||= source.host === request.headers.get('host') && source.protocol === request.nextUrl.protocol
  } catch {}
  if(method!=='GET'&&!sameOrigin) return Response.json({error:'Open the game on this website to continue.'},{status:403})
  let body: string | undefined
  if(method==='POST'){
    const reader=request.body?.getReader();let size=0;const parts:Uint8Array[]=[]
    if(reader){while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>65536){await reader.cancel();return Response.json({error:'Replay too large.'},{status:413})}parts.push(part.value)}}
    body=Buffer.concat(parts).toString('utf8')
  }
  try {
    const response=await fetch(`${service}/pantry/${path.join('/')}${request.nextUrl.search}`,{
      method,body,cache:'no-store',signal:AbortSignal.timeout(10000),headers:{
        'Content-Type':'application/json',cookie:request.cookies.get('pantry-player') ? `pantry-player=${request.cookies.get('pantry-player')!.value}` : '',origin:request.headers.get('origin')||'',
        'sec-fetch-site':request.headers.get('sec-fetch-site')||'none',
        // This origin binds to loopback behind the existing Cloudflare tunnel.
        'x-pantry-network':request.headers.get('cf-connecting-ip')||'local',
      },
    })
    const headers=new Headers({'Content-Type':'application/json','Cache-Control':response.headers.get('cache-control')||'no-store','X-Content-Type-Options':'nosniff'})
    for(const name of ['set-cookie','retry-after']){const value=response.headers.get(name);if(value)headers.set(name,value)}
    return new Response(await response.text(),{status:response.status,headers})
  } catch { return Response.json({error:'The leaderboard is unavailable. Practice still works.'},{status:503,headers:{'Cache-Control':'no-store'}}) }
}
export const GET=forward
export const POST=forward
export const DELETE=forward

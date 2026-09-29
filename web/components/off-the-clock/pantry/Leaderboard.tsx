'use client'
import { useEffect, useRef, useState } from 'react'
import { FOODS } from '@/lib/off-the-clock/pantry/config'
import styles from './Pantry.module.css'
import { useSurfaceControls } from '../GameControls'
export type Entry = { id:string; initials:string; score:number; highest:number; date:string; rank:number }
export type Board = { entries:Entry[]; record:Entry|null; updatedAt:string }
export const API='/api/off-the-clock/pantry'
export async function request<T>(path:string,options?:RequestInit):Promise<T>{
  const timeout=AbortSignal.timeout(12000)
  const signal=options?.signal?AbortSignal.any([options.signal,timeout]):timeout
  const response=await fetch(API+path,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...options?.headers},signal})
  const data=await response.json().catch(()=>({error:'The leaderboard is unavailable. Please retry.'}))
  if(!response.ok)throw Error(data.error||'The leaderboard is unavailable. Please retry.')
  return data as T
}
export function Leaderboard({ onBack }: { onBack:()=>void }) {
  const [page,setPage]=useState(0)
  const [board,setBoard]=useState<Board>(),[mine,setMine]=useState<Entry|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[confirm,setConfirm]=useState(false),[refresh,setRefresh]=useState(0)
  const root=useRef<HTMLElement>(null)
  useSurfaceControls(root,true,50,()=>confirm?setConfirm(false):onBack())
  useEffect(()=>{const controller=new AbortController();void Promise.all([request<Board>('/leaderboard',{signal:controller.signal}),request<{entry:Entry|null}>('/me',{signal:controller.signal})]).then(([b,m])=>{setBoard(b);setMine(m.entry);setLoading(false)}).catch(e=>{if(!controller.signal.aborted){setError(e.message);setLoading(false)}});return()=>controller.abort()},[refresh])
  async function remove(){setLoading(true);setError('');try{await request('/me/entry',{method:'DELETE'});setMine(null);setConfirm(false);setRefresh(v=>v+1)}catch(e){setError((e as Error).message);setLoading(false)}}
  return <section ref={root} className={styles.leaderboard} aria-label="Pantry Drop leaderboard">
    <div className={styles.sectionHead}><div><span className={styles.kicker}>THE CABINET RECORDS</span><h3>Island leaderboard</h3></div><button onClick={onBack}>← Back</button></div>
    <p>Verified runs. Three initials. A little friendly competition.</p>
    {loading&&<p role="status">Loading the board…</p>}{error&&<p role="alert">{error} {board?'Showing the last loaded board.':''}</p>}
    {board&&<><div className={styles.recordBanner}><span>Island record</span><strong>{board.record?board.record.score.toLocaleString():'—'}</strong><span>{board.record?.initials||'Your initials could be here'}</span></div>
      {board.entries.length?<div className={styles.tableWrap}><table><caption className={styles.srOnly}>Top 20 verified scores, current rules</caption><thead><tr><th>Rank</th><th>Initials</th><th>Score</th><th>Food</th><th>Date</th></tr></thead><tbody>{board.entries.slice(page*4,page*4+4).map(e=><tr key={e.id} data-mine={mine?.id===e.id}><td>{e.rank}</td><td>{e.initials}{mine?.id===e.id?' · You':''}</td><td>{e.score.toLocaleString()}</td><td>{FOODS[e.highest]?.name}</td><td>{new Date(e.date).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</td></tr>)}</tbody></table><nav className={styles.actions}><button disabled={!page} onClick={()=>setPage(page-1)}>Previous</button><span>{page+1} / {Math.ceil(board.entries.length/4)}</span><button disabled={(page+1)*4>=board.entries.length} onClick={()=>setPage(page+1)}>Next</button></nav></div>:<p className={styles.empty}>The board is waiting for its first score.</p>}
      <p className={styles.note}>Updated {new Date(board.updatedAt).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}. Equal scores share a rank. One best per browser, for these rules.</p></>}
    {mine&&<div className={styles.mine}><strong>Your verified best · {mine.score.toLocaleString()}</strong><span>Rank {mine.rank} · {mine.initials}</span>{confirm?<div data-game-modal><p>Remove your posted score from this board?</p><button data-autofocus onClick={()=>setConfirm(false)}>Keep score</button><button onClick={()=>void remove()} disabled={loading}>Remove score</button></div>:<button onClick={()=>setConfirm(true)}>Remove my posted score</button>}</div>}
    <button disabled={loading} onClick={()=>{setLoading(true);setError('');setRefresh(v=>v+1)}}>Refresh board ↻</button>
  </section>
}

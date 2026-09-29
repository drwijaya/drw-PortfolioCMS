'use client'
import { useRooms } from './CollectionData'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { journals, mediaFormats, MEDIA_ROOMS,  type JournalEntry, type MediaRoom } from '@/content/off-the-clock'
import { MediaArtwork } from './MediaArtwork'
import { ObjectInspector } from './ObjectInspector'
import { GameReader } from './GameReader'
import ListeningRoom from './ListeningRoom'
import { useSurfaceControls } from './GameControls'
import type { SoundControls } from './useIslandSound'
import styles from './GameUI.module.css'
export function JournalBody({entry}:{entry:JournalEntry}) {return <><time dateTime={entry.date}>{entry.date}</time>{entry.paragraphs.map((p,i)=><p key={i}>{p}</p>)}{!!entry.spoilers?.length&&<details><summary>Read notes with spoilers</summary>{entry.spoilers.map((p,i)=><p key={i}>{p}</p>)}</details>}</>}
export function GameNotebook({room,entrySlug,entryRoom,onEntry,onBack,sound,suspended=false,closeRequestRef}:{room:MediaRoom;entrySlug?:string;entryRoom?:MediaRoom;onEntry:(slug?:string,tab?:MediaRoom)=>void;onBack:()=>void;sound:SoundControls;suspended?:boolean;closeRequestRef?:RefObject<(()=>void)|null>}) {
  const rooms=useRooms()
  const [tab,setTab]=useState<MediaRoom|null>(null),[item,setItem]=useState<number|null>(null),[listening,setListening]=useState(false),[page,setPage]=useState(0)
  const [lastItem,setLastItem]=useState(0),[lastTab,setLastTab]=useState(room)
  const root=useRef<HTMLDivElement>(null),playerBack=useRef<(()=>void)|null>(null)
  const category=tab??entryRoom??lastTab,entry=entrySlug?journals[entryRoom??category].find(e=>e.slug===entrySlug):undefined
  function back(){if(listening){playerBack.current?.();return}if(entrySlug){onEntry();return}if(item!==null){setLastItem(item);setItem(null);return}if(tab){setTab(null);return}onBack()}
  useEffect(()=>{if(closeRequestRef)closeRequestRef.current=back;return()=>{if(closeRequestRef)closeRequestRef.current=null}})
  useSurfaceControls(root,item===null&&!entry&&!listening&&!suspended,35,back)
  if(listening)return <ListeningRoom sound={sound} initialIndex={item??0} startAtPlayer suspended={suspended} closeRequestRef={playerBack} onExit={()=>setListening(false)}/>
  if(item!==null)return <ObjectInspector room={category} index={item} onIndex={setItem} onDone={back} onListen={()=>setListening(true)}/>
  if(entry)return <GameReader title={entry.title} paragraphs={entry.paragraphs} spoilers={entry.spoilers} href={`/playground/offtheclock/${entryRoom??category}/journal/${entry.slug}`} onBack={back}/>
  const favorites=rooms[category].favorites,pages=Math.ceil(favorites.length/4)
  return <div ref={root} className={styles.screen} data-ui-screen={entrySlug?'missing-note':tab?'collection-grid':'collections'}>
    <header className={styles.header}><h2>{entrySlug?'Notes':tab?rooms[tab].name:'Collections'}</h2><span className={styles.kicker}>{tab?`${favorites.length} FAVORITES`:'A FEW FAVORITES'}</span></header>
    {entrySlug?<div className={styles.status}><p>This note isn’t available yet.</p><button data-autofocus onClick={()=>{onEntry();setTab(category)}}>Browse {rooms[category].name}</button></div>:!tab?<div className={styles.categories}>{MEDIA_ROOMS.map(id=><button data-focus-id={`category-${id}`} data-autofocus={id===category?true:undefined} className={styles.category} key={id} onClick={()=>{setTab(id);setLastTab(id);setPage(0);setLastItem(0)}}><span className={styles.categoryArt}><MediaArtwork room={id} item={rooms[id].favorites[0]}/></span><strong>{rooms[id].name}</strong><small>{rooms[id].favorites.length} items ›</small></button>)}</div>:<div className={styles.collectionGrid}>{favorites.slice(page*4,page*4+4).map((favorite,offset)=>{const i=page*4+offset;return <button className={styles.card} key={favorite.id} data-focus-id={`item-${i}`} data-autofocus={i===lastItem?true:undefined} data-nav-left={offset%2?`item-${i-1}`:`item-${i}`} data-nav-right={offset%2===0&&i+1<favorites.length?`item-${i+1}`:`item-${i}`} data-nav-up={offset>=2?`item-${i-2}`:`item-${i}`} data-nav-down={offset<2&&i+2<favorites.length?`item-${i+2}`:'collection-back'} onClick={()=>setItem(i)}><span className={styles.cardArt} style={{aspectRatio:mediaFormats[category].ratio}}><MediaArtwork room={category} item={favorite}/></span><span><small>{String(i+1).padStart(2,'0')}</small><strong>{favorite.title}</strong></span></button>})}</div>}
    <footer className={styles.footer}><span>A · Open</span>{tab&&pages>1&&<><button disabled={!page} onClick={()=>setPage(page-1)}>‹</button><span>{page+1}/{pages}</span><button disabled={page>=pages-1} onClick={()=>setPage(page+1)}>›</button></>}<button data-focus-id="collection-back" onClick={back}>B · Back</button></footer>
  </div>
}

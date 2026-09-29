'use client'
import { useRooms } from './CollectionData'
import { useRef, useState } from 'react'
import { homelab, mediaFormats,  type RoomId } from '@/content/off-the-clock'
import { MediaArtwork } from './MediaArtwork'
import { useSurfaceControls } from './GameControls'
import { GameReader } from './GameReader'
import styles from './GameUI.module.css'
export function ObjectInspector({room,index,onIndex,onDone,onListen}:{room:RoomId;index:number;onIndex:(i:number)=>void;onDone:()=>void;onListen?:(index:number)=>void;onJournal?:()=>void;onMenu?:()=>void}) {
  const rooms=useRooms()
  const root=useRef<HTMLDivElement>(null),[reading,setReading]=useState(false)
  useSurfaceControls(root,!reading,40,onDone)
  if(room==='homelab')return <div ref={root} className={styles.screen} data-ui-screen="workbench"><header className={styles.header}><h2>At the workbench</h2></header><div className={styles.workbench}><span className={styles.kicker}>WORKSHOP</span><h3>{homelab.sections[index]?.title??'On the workbench'}</h3><p>{homelab.sections[index]?.body??rooms.homelab.empty}</p></div><footer className={styles.footer}><span>A · Select</span><button onClick={onDone}>B · Back</button></footer></div>
  const item=rooms[room].favorites[index],count=rooms[room].favorites.length
  if(reading&&item?.note)return <GameReader title={item.title} paragraphs={[item.note]} onBack={()=>setReading(false)}/>
  return <div ref={root} className={styles.screen} data-ui-screen="item">
    <header className={styles.header}><h2>{rooms[room].name}</h2><nav aria-label="Browse favorites"><button aria-label="Previous favorite" disabled={index===0} onClick={()=>onIndex(index-1)}>‹</button><span>{String(index+1).padStart(2,'0')} / {String(count).padStart(2,'0')}</span><button aria-label="Next favorite" disabled={index>=count-1} onClick={()=>onIndex(index+1)}>›</button></nav></header>
    <div className={styles.inspector}><div className={styles.artWell}><div className={styles.inspectorCover} style={{aspectRatio:mediaFormats[room].ratio,width:room==='film'?148:180}}><MediaArtwork room={room} item={item}/></div></div>
      <div className={styles.detail}><span className={styles.kicker}>{room==='music'?'RECORD SLEEVE':room==='film'?'CINEMA POSTER':'GAME SHELF'}</span><h3>{item?.title??'A favorite to come'}</h3><p className={styles.meta}>{item?.creator}<br/>{item?.year}</p><div className={styles.detailActions}>{room==='music'&&onListen&&<button data-autofocus className={styles.primary} onClick={()=>onListen(index)}>▸ Listen</button>}{item?.note&&<button data-autofocus={room!=='music'?true:undefined} onClick={()=>setReading(true)}>Read note</button>}</div></div>
    </div><footer className={styles.footer}><span>A · Select</span><button onClick={onDone}>B · Back</button></footer>
  </div>
}

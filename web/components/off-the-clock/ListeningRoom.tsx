'use client'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useRooms } from './CollectionData'
import { listeningAlbums } from '@/content/off-the-clock-listening'
import { formatTime } from '@/lib/off-the-clock/turntable'
import { MediaArtwork } from './MediaArtwork'
import type { SoundControls } from './useIslandSound'
import { useRecordPlayer } from './turntable/useRecordPlayer'
import { useSurfaceControls } from './GameControls'
import ui from './GameUI.module.css'
import styles from './ListeningRoom.module.css'
const statuses={idle:'Ready to play',loading:'Loading recording…',ready:'Ready to play',playing:'Now playing',paused:'Paused',buffering:'Buffering…',ended:'Record finished',blocked:'Select Play to continue',error:'Recording unavailable'}
export default function ListeningRoom({sound,initialIndex=0,startAtPlayer=false,closeRequestRef,suspended=false,onExit}:{sound:SoundControls;initialIndex?:number;startAtPlayer?:boolean;closeRequestRef?:RefObject<(()=>void)|null>;suspended?:boolean;onExit?:()=>void;onMenu?:()=>void}) {
  const rooms=useRooms()
  const root=useRef<HTMLDivElement>(null)
  const [albumIndex,setAlbumIndex]=useState(Math.max(0,Math.min(listeningAlbums.length-1,initialIndex)))
  const [trackIndex,setTrackIndex]=useState(0),[view,setView]=useState<'crate'|'player'|'tracks'>(startAtPlayer?'player':'crate'),[page,setPage]=useState(0)
  const album=listeningAlbums[albumIndex],favorite=rooms.music.favorites.find(item=>item.id===album.albumId)!,track=album.tracks[trackIndex]
  const playback=useRecordPlayer(sound,suspended,()=>{if(trackIndex+1<album.tracks.length){const next=trackIndex+1;setTrackIndex(next);setPage(Math.floor(next/4));return album.tracks[next].videoId}})
  const {pause,request,mountRef}=playback
  const isPlaying=playback.status==='playing'||playback.status==='buffering',pages=Math.ceil(album.tracks.length/4)
  function back(){if(view==='tracks'){setView('player');return}pause();if(view==='player'&&!startAtPlayer)setView('crate');else onExit?.()}
  useEffect(()=>{if(closeRequestRef)closeRequestRef.current=back;return()=>{if(closeRequestRef)closeRequestRef.current=null}})
  useSurfaceControls(root,!suspended,50,back)
  function choose(index:number){pause();setAlbumIndex(index);setTrackIndex(0);setPage(0);setView('player');if(playback.connected)request(listeningAlbums[index].tracks[0].videoId,false,false)}
  function play(index=trackIndex){setTrackIndex(index);request(album.tracks[index].videoId,true,true,index!==trackIndex)}
  return <div ref={root} className={ui.screen} data-ui-screen={`listening-${view}`} data-turntable-view={view==='crate'?'choose':'deck'} data-playback={playback.status} data-provider-error={playback.error}>
    <header className={ui.header}><h2>{view==='crate'?'The record crate':view==='tracks'?'Tracks':'At the turntable'}</h2><span className={ui.kicker}>{view==='crate'?'4 FAVORITES':`${trackIndex+1} / ${album.tracks.length}`}</span></header>
    <div className={styles.body}>
      {view==='crate'&&<div className={ui.collectionGrid}>{listeningAlbums.map((record,i)=>{const item=rooms.music.favorites.find(f=>f.id===record.albumId)!;return <button data-autofocus={i===albumIndex?true:undefined} className={ui.card} key={record.albumId} onClick={()=>choose(i)} aria-label={`Open ${item.title}`}><span className={ui.cardArt} style={{aspectRatio:1}}><MediaArtwork room="music" item={item}/></span><span><small>RECORD {i+1}</small><strong>{item.title}</strong></span></button>})}</div>}
      {/* Keep the provider mount stable across app-owned track/crate views. */}
      <div className={styles.player} hidden={view!=='player'}>
        <div className={styles.provider} data-provider-connected={playback.connected}>
          <div ref={mountRef} className={styles.mount} aria-label="YouTube player"/>
          {(!playback.connected||playback.status==='loading'||playback.status==='error')&&<div className={styles.idle}><span className={styles.cover}><MediaArtwork room="music" item={favorite}/></span><span>{playback.status==='error'?'Recording unavailable':playback.status==='loading'?'Loading recording…':'Connect with Play'}</span></div>}
        </div>
        <div className={styles.recordInfo}><span className={ui.kicker}>{statuses[playback.status]}</span><h3>{track.title}</h3><p>{favorite.title}<br/>{favorite.creator}</p><span>{formatTime(playback.clock.elapsed)} / {formatTime(playback.clock.duration||track.duration)}</span><a href={`https://www.youtube.com/watch?v=${track.videoId}`} target="_blank" rel="noreferrer">YouTube ↗</a></div>
        <div className={styles.transport}><button data-autofocus className={ui.primary} onClick={()=>isPlaying?pause():playback.status==='error'?playback.retry():play()}>{isPlaying?'Ⅱ Pause':playback.status==='error'?'Retry':'▶ Play'}</button><button aria-label="Previous song" disabled={!trackIndex} onClick={()=>play(trackIndex-1)}>‹</button><button aria-label="Next song" disabled={trackIndex>=album.tracks.length-1} onClick={()=>play(trackIndex+1)}>›</button><button onClick={()=>{pause();setPage(Math.floor(trackIndex/4));setView('tracks')}}>Tracks</button></div>
      </div>
      {view==='tracks'&&<div className={styles.tracks}>{album.tracks.slice(page*4,page*4+4).map((song,offset)=>{const i=page*4+offset;return <button data-track-index={i} data-autofocus={i===trackIndex?true:undefined} key={song.id} aria-pressed={i===trackIndex} onClick={()=>{pause();setTrackIndex(i);if(playback.connected)request(album.tracks[i].videoId,false,false);setView('player')}}><span>{String(i+1).padStart(2,'0')}</span><strong>{song.title}</strong><time>{formatTime(song.duration)}</time>{i===trackIndex&&<span aria-label={isPlaying?'Playing':'Selected'}>{isPlaying?'▶':'◆'}</span>}</button>})}</div>}
    </div>
    <footer className={ui.footer}>{view==='player'?<label className={styles.volume}>Volume <input type="range" aria-label="Record volume" min="0" max="100" step="5" value={playback.volume} onChange={e=>playback.changeVolume(Number(e.target.value))}/></label>:view==='tracks'?<nav className={styles.pages}><button disabled={!page} onClick={()=>setPage(page-1)} aria-label="Previous track page">‹</button><span>{page+1}/{pages}</span><button disabled={page>=pages-1} onClick={()=>setPage(page+1)} aria-label="Next track page">›</button></nav>:<span>A · Open record</span>}<button onClick={back}>B · Back</button></footer>
  </div>
}

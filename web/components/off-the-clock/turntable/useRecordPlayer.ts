'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadYouTube, type YouTubePlayer } from '@/lib/off-the-clock/youtube'
import type { SoundControls } from '../useIslandSound'

export type Playback = 'idle'|'loading'|'ready'|'playing'|'paused'|'buffering'|'ended'|'blocked'|'error'

/** One provider for the life of the activity. View changes never own the iframe. */
export function useRecordPlayer(sound:SoundControls, suspended:boolean, onEnded:()=>string|undefined) {
  const mountRef=useRef<HTMLDivElement>(null)
  const player=useRef<YouTubePlayer|null>(null)
  const [connection,setConnection]=useState(0)
  const [status,setStatus]=useState<Playback>('idle')
  const [error,setError]=useState<number>()
  const [clock,setClock]=useState({elapsed:0,duration:0})
  const [volume,setVolume]=useState(60)
  const desired=useRef<{id:string;play:boolean}|null>(null)
  const ready=useRef(false),visible=useRef(true),playing=useRef(false)
  const settings=useRef({sound,suspended,onEnded,volume})
  useEffect(()=>{settings.current={sound,suspended,onEnded,volume}},[sound,suspended,onEnded,volume])

  const pause=useCallback(()=>{
    if(desired.current)desired.current.play=false
    playing.current=false
    player.current?.pauseVideo()
    setStatus(s=>s==='playing'||s==='buffering'||s==='loading'?'paused':s)
  },[])

  const request=useCallback((id:string,play:boolean,userGesture=true,restart=false)=>{
    const previous=desired.current
    desired.current={id,play};setError(undefined)
    if(play&&userGesture)void settings.current.sound.enable()
    if(!previous||previous.id!==id)setClock({elapsed:0,duration:0})
    if(ready.current&&player.current){
      if(play){
        setStatus('buffering')
        if(userGesture||settings.current.sound.enabled)player.current.unMute()
        // A just-cued recording may not have finished receiving the cue command.
        // Load-and-play is atomic; reserve playVideo for an actual paused resume.
        const state=player.current.getPlayerState()
        if(previous?.id===id&&!restart&&(state===2||state===1))player.current.playVideo()
        else player.current.loadVideoById(id)
      }else if(previous?.id!==id){player.current.cueVideoById(id);setStatus('ready')}
    }else{setStatus('loading');setConnection(n=>n||1)}
  },[])

  useEffect(()=>{
    if(!connection||!mountRef.current)return
    const host=mountRef.current
    let dead=false,instance:YouTubePlayer|undefined
    ready.current=false
    const fail=()=>{if(!dead){setStatus('error');ready.current=false}}
    const timeout=setTimeout(fail,18000)
    void loadYouTube().then(api=>{
      if(dead||!desired.current)return
      // Delegate before navigation, rather than adding allow after onReady.
      const frame=document.createElement('iframe')
      frame.title='YouTube record player'
      frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture'
      frame.referrerPolicy='strict-origin-when-cross-origin'
      frame.src=`https://www.youtube-nocookie.com/embed/${desired.current.id}?enablejsapi=1&playsinline=1&autoplay=0&controls=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`
      host.replaceChildren(frame)
      instance=new api.Player(frame,{host:'https://www.youtube-nocookie.com',videoId:desired.current.id,width:'100%',height:'100%',playerVars:{playsinline:1,autoplay:0,controls:1,origin:window.location.origin},events:{
        onReady:({target})=>{
          if(dead)return
          clearTimeout(timeout);ready.current=true;player.current=target
          target.setVolume(settings.current.volume)
          if(!settings.current.sound.enabled)target.mute()
          const intent=desired.current
          if(intent?.play&&!settings.current.suspended&&visible.current&&!document.hidden){target.unMute();setStatus('buffering');target.loadVideoById(intent.id)}
          else {if(intent)target.cueVideoById(intent.id);setStatus('ready')}
        },
        onStateChange:({data})=>{
          if(dead)return
          if(data===1){
            if(settings.current.suspended||!visible.current||document.hidden){instance?.pauseVideo();return}
            if(desired.current)desired.current.play=true
            playing.current=true;setStatus('playing')
          }else if(data===2){playing.current=false;setStatus('paused')}
          else if(data===3){playing.current=false;setStatus('buffering')}
          else if(data===5){playing.current=false;setStatus('ready')}
          else if(data===0&&playing.current){
            playing.current=false;setStatus('ended')
            if(desired.current?.play&&!settings.current.suspended&&visible.current&&!document.hidden){const next=settings.current.onEnded();if(next)request(next,true,false)}
          }
        },
        onError:({data})=>{if(!dead){clearTimeout(timeout);playing.current=false;setError(data);setStatus('error')}},
        onAutoplayBlocked:()=>{if(!dead){playing.current=false;setStatus('blocked')}},
      }})
    }).catch(fail)
    const observer=new IntersectionObserver(([entry])=>{visible.current=entry.isIntersecting&&entry.intersectionRatio>.5;if(!visible.current)pause()},{threshold:[0,.5,1]})
    observer.observe(host)
    const hide=()=>{if(document.hidden)pause()}
    document.addEventListener('visibilitychange',hide)
    const timer=setInterval(()=>{
      if(!ready.current||!instance||dead)return
      setClock({elapsed:instance.getCurrentTime()||0,duration:instance.getDuration()||0})
    },500)
    return()=>{dead=true;ready.current=false;clearTimeout(timeout);clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',hide);instance?.destroy();player.current=null;host.replaceChildren()}
  },[connection,pause,request])

  useEffect(()=>{
    if(sound.enabled)player.current?.unMute();else player.current?.mute()
  },[sound.enabled])
  useEffect(()=>{if(!suspended)return;player.current?.pauseVideo();const id=requestAnimationFrame(pause);return()=>cancelAnimationFrame(id)},[suspended,pause])
  const changeVolume=(value:number)=>{setVolume(value);player.current?.setVolume(value)}
  const retry=()=>{ready.current=false;setError(undefined);setStatus('loading');if(desired.current)desired.current.play=true;void sound.enable();setConnection(n=>n+1)}
  return {mountRef,status,error,clock,volume,changeVolume,request,pause,retry,connected:connection>0}
}

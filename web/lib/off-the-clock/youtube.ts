export type YouTubePlayer = {
  playVideo(): void; pauseVideo(): void; mute(): void; unMute(): void
  setVolume(n:number): void; getVolume(): number; isMuted(): boolean
  cueVideoById(id:string): void; loadVideoById(id:string): void
  getCurrentTime(): number; getDuration(): number; getVideoUrl(): string; getPlayerState(): number
  seekTo(seconds:number, allowSeekAhead:boolean): void
  destroy(): void; getIframe(): HTMLIFrameElement
}
export type YouTubeAPI = { Player: new (element: HTMLElement, options: { host: string; videoId: string; width: string; height: string; playerVars: Record<string,string|number>; events: { onReady(e:{target:YouTubePlayer}):void; onStateChange(e:{data:number}):void; onError(e:{data:number}):void; onAutoplayBlocked():void } }) => YouTubePlayer }
declare global { interface Window { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void } }
let loading: Promise<YouTubeAPI> | undefined
/** Called only after intentional interaction with the record cabinet. */
export function loadYouTube(): Promise<YouTubeAPI> {
  if(window.YT?.Player)return Promise.resolve(window.YT)
  if(loading)return loading
  loading=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true
    const previous=window.onYouTubeIframeAPIReady
    const cleanup=()=>{clearTimeout(timeout);script.onerror=null;window.onYouTubeIframeAPIReady=previous}
    const fail=()=>{cleanup();script.remove();loading=undefined;reject(Error('YouTube could not load.'))}
    const timeout=setTimeout(fail,12000)
    window.onYouTubeIframeAPIReady=()=>{cleanup();previous?.();if(window.YT?.Player)resolve(window.YT);else fail()}
    script.onerror=fail;document.head.append(script)
  })
  return loading
}

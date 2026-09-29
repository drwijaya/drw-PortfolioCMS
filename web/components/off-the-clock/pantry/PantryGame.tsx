'use client'
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type MutableRefObject, type KeyboardEvent, type PointerEvent } from 'react'
import { BOARD, FOODS, RULES_VERSION, type GameState } from '@/lib/off-the-clock/pantry/config'
import { initPhysics, PantrySimulation } from '@/lib/off-the-clock/pantry/core'
import { CLASSIC, NIGHT, drawPantry, paintFood } from '@/lib/off-the-clock/pantry/art'
import type { SoundControls } from '../useIslandSound'
import { Leaderboard, request, type Board, type Entry } from './Leaderboard'
import { useControlLayer, useSurfaceControls } from '../GameControls'
import styles from './Pantry.module.css'
import { GameReader } from '../GameReader'

type Phase='intro'|'help'|'loading'|'playing'|'paused'|'result'|'board'
type Ticket={id:string;seed:number;version:string;expiresAt:string}
type Verification={status:string;error?:string;verifiedScore?:number;entry?:Entry}
const bestKey=`off-clock-pantry-best:${RULES_VERSION}`
const empty:GameState={tick:0,score:0,merges:0,highest:0,drops:0,current:0,next:1,ready:true,warning:0,ended:null,foods:[]}
const number=(n:number)=>n.toLocaleString()
function FoodIcon({tier,size=40}:{tier:number;size?:number}){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{const ctx=ref.current?.getContext('2d');if(ctx){ctx.clearRect(0,0,40,40);paintFood(ctx,tier,20,20,20,document.documentElement.dataset.theme==='dark'?NIGHT:CLASSIC)}},[tier])
  return <canvas ref={ref} width={40} height={40} style={{width:size,height:size}} aria-hidden="true"/>
}
export default function PantryGame({sound,onSettings,onExit,closeRequest,pauseSignal=0,runActive:runActiveRef,onKeep}:{runActive:MutableRefObject<boolean>;onKeep:()=>void;pauseSignal?:number;sound:SoundControls;onSettings:()=>void;onExit:()=>void;closeRequest:MutableRefObject<(()=>void)|null>}){
  const [phase,setPhase]=useState<Phase>('intro'),[state,setState]=useState<GameState>(empty),[aim,setAim]=useState(160),[best,setBest]=useState(0),[record,setRecord]=useState<number|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirmExit,setConfirmExit]=useState(false),[initials,setInitials]=useState('YOU'),[submitting,setSubmitting]=useState(false),[posted,setPosted]=useState<Verification>(),[showSubmit,setShowSubmit]=useState(false),[isRanked,setIsRanked]=useState(false)
  const canvas=useRef<HTMLCanvasElement>(null),sim=useRef<PantrySimulation|null>(null),aimRef=useRef(160),ticket=useRef<Ticket|null>(null),generation=useRef({serial:0}),boardReturn=useRef<Phase>('intro'),audio=useRef<AudioContext|null>(null),soundRef=useRef(sound),submissionAbort=useRef<AbortController|null>(null)
  useEffect(()=>{soundRef.current=sound;if(!sound.enabled)void audio.current?.suspend().catch(()=>{})},[sound])
  useEffect(()=>{
    const lifetime=generation.current
    const id=requestAnimationFrame(()=>{try{const value=Number(localStorage.getItem(bestKey));if(Number.isSafeInteger(value)&&value>=0)setBest(value)}catch{setError('Device best cannot be saved in this browser. You can still play.')}})
    const controller=new AbortController();void request<Board>('/leaderboard',{signal:controller.signal}).then(b=>setRecord(b.record?.score??0)).catch(()=>{})
    return()=>{cancelAnimationFrame(id);controller.abort();lifetime.serial++;submissionAbort.current?.abort();sim.current?.destroy();sim.current=null;void audio.current?.close().catch(()=>{})}
  },[])
  useEffect(()=>{const id=requestAnimationFrame(()=>setPhase(p=>p==='playing'?'paused':p));return()=>cancelAnimationFrame(id)},[pauseSignal])
  useEffect(()=>{runActiveRef.current=['playing','paused'].includes(phase)||(phase==='board'&&boardReturn.current==='paused');return()=>{runActiveRef.current=false}},[phase,runActiveRef])
  const moveAim=useCallback((x:number)=>{const radius=FOODS[sim.current?.current??0].radius;const next=Math.round(Math.max(radius,Math.min(BOARD.width-radius,x)));aimRef.current=next;setAim(next)},[])
  const saveBest=useCallback((score:number)=>{
    setBest(old=>Math.max(old,score))
    try{const old=Number(localStorage.getItem(bestKey)||0);localStorage.setItem(bestKey,String(Math.max(Number.isSafeInteger(old)?old:0,score)))}catch{setError('Device best cannot be saved in this browser. Your current score is still shown.')}
  },[])
  const cue=useCallback((merge:boolean)=>{
    const s=soundRef.current;if(!s.enabled||s.levels.effects===0)return
    try{audio.current??=new AudioContext();const ctx=audio.current;void ctx.resume().catch(()=>{});const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.value=merge?540:150;gain.gain.setValueAtTime(s.levels.effects/100*.09,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.13);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.15);osc.onended=()=>{osc.disconnect();gain.disconnect()}}catch{}
  },[])
  useImperativeHandle(closeRequest,()=>()=>{if(['playing','paused'].includes(phase)||(phase==='board'&&boardReturn.current==='paused')){setPhase('paused');setConfirmExit(true)}else if(phase==='loading'){generation.current.serial++;onExit()}else onExit()},[phase,onExit])
  useEffect(()=>{
    const pause=()=>{setPhase(p=>p==='playing'?'paused':p);void audio.current?.suspend().catch(()=>{})}
    const hide=()=>{if(document.hidden)pause()}
    window.addEventListener('blur',pause);document.addEventListener('visibilitychange',hide)
    return()=>{window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',hide)}
  },[])
  useEffect(()=>{
    if(phase!=='playing'&&phase!=='paused'&&phase!=='result')return
    const ctx=canvas.current?.getContext('2d');if(!ctx)return
    let frame=0,last=0,accumulator=0,lastUI=0,lastMerges=sim.current?.merges||0
    const render=(now:number)=>{
      const current=sim.current;if(!current)return
      if(phase==='playing'&&!document.hidden){
        const elapsed=last?now-last:0
        if(elapsed>350){setPhase('paused');setNotice('Paused while the screen was busy. Resume when you’re ready.');return}
        accumulator+=Math.min(elapsed,100)
        while(accumulator>=1000/60&&!current.ended){current.step();accumulator-=1000/60}
      }
      last=now
      const view=current.state()
      const radius=FOODS[view.current].radius;const clamped=Math.max(radius,Math.min(BOARD.width-radius,aimRef.current));if(clamped!==aimRef.current){aimRef.current=clamped;setAim(clamped)}
      drawPantry(ctx,view,aimRef.current,document.documentElement.dataset.theme==='dark'?NIGHT:CLASSIC)
      if(canvas.current){canvas.current.dataset.score=String(view.score);canvas.current.dataset.tick=String(view.tick);canvas.current.dataset.foods=String(view.foods.length);canvas.current.dataset.rules=RULES_VERSION}
      if(view.merges>lastMerges){cue(true);lastMerges=view.merges}
      if(now-lastUI>100){setState(view);lastUI=now}
      if(view.ended&&phase==='playing'){
        setState(view);setPhase('result');saveBest(view.score);return
      }
      if(phase==='playing')frame=requestAnimationFrame(render)
    }
    frame=requestAnimationFrame(render);return()=>cancelAnimationFrame(frame)
  },[phase,cue,saveBest])
  async function start(ranked:boolean){
    const own=++generation.current.serial;setPhase('loading');setError('');setNotice('');setPosted(undefined);setShowSubmit(false);setConfirmExit(false);ticket.current=null
    try{
      const [run]=await Promise.all([ranked?request<Ticket>('/runs',{method:'POST',body:'{}'}):Promise.resolve(null),initPhysics()])
      if(own!==generation.current.serial)return
      if(run&&run.version!==RULES_VERSION)throw Error('The cabinet has new rules. Reload the page before a ranked run.')
      ticket.current=run;setIsRanked(!!run);sim.current?.destroy();sim.current=new PantrySimulation(run?.seed??crypto.getRandomValues(new Uint32Array(1))[0]);setState(sim.current.state());moveAim(160);setPhase('playing')
      requestAnimationFrame(()=>canvas.current?.focus({preventScroll:true}))
    }catch(e){if(own===generation.current.serial){setError((e as Error).message||'The cabinet could not start. Please retry.');setPhase('intro')}}
  }
  function drop(){if(phase!=='playing')return;if(sim.current?.drop(aimRef.current)){setState(sim.current.state());setNotice('');cue(false)}else setNotice('Give the food a moment, or choose a clear spot.')}
  function key(event:KeyboardEvent<HTMLCanvasElement>){
    if(['ArrowLeft','ArrowRight','a','d','A','D'].includes(event.key)){event.preventDefault();moveAim(aimRef.current+(['ArrowLeft','a','A'].includes(event.key)?-5:5))}
    if(event.key===' '||event.key==='Enter'){event.preventDefault();if(!event.repeat)drop()}
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();escape()}
  }
  function pointer(event:PointerEvent<HTMLCanvasElement>){const rect=event.currentTarget.getBoundingClientRect();moveAim((event.clientX-rect.left)/rect.width*BOARD.width)}
  function finish(){const current=sim.current;if(!current)return;current.finish();const view=current.state();setState(view);setPhase('result');setConfirmExit(false);saveBest(view.score)}
  function openBoard(){boardReturn.current=phase==='playing'?'paused':phase;setPhase('board')}
  async function submit(){
    if(!ticket.current||!sim.current||submitting)return
    const controller=new AbortController();submissionAbort.current?.abort();submissionAbort.current=controller;setSubmitting(true);setError('')
    try{
      const id=ticket.current.id
      let result=await request<Verification>(`/runs/${id}/submit`,{method:'POST',signal:controller.signal,body:JSON.stringify({initials,events:sim.current.inputs,endTick:Math.max(1,sim.current.tick)})})
      for(let i=0;result.status==='pending'&&i<40;i++){
        await new Promise(resolve=>setTimeout(resolve,800));if(controller.signal.aborted)return
        result=await request<Verification>(`/runs/${id}/status`,{signal:controller.signal})
      }
      if(controller.signal.aborted)return
      if(result.status==='accepted'){setPosted(result);setShowSubmit(false);void request<Board>('/leaderboard').then(b=>setRecord(b.record?.score??0)).catch(()=>{})}
      else throw Error(result.error||(result.status==='pending'?'Still checking. Retry to retrieve the same result.':'This run could not be posted.'))
    }catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{if(!controller.signal.aborted)setSubmitting(false)}
  }
  const controlsRoot=useRef<HTMLDivElement>(null)
  const active=['playing','paused','result'].includes(phase)
  function escape(){
    if(confirmExit){setConfirmExit(false);onKeep();return}
    if(showSubmit){setShowSubmit(false);return}
    if(phase==='help'){setPhase('intro');return}
    if(phase==='board'){setPhase(boardReturn.current);return}
    if(phase==='playing'){setPhase('paused');return}
    if(phase==='paused'){setPhase('playing');return}
    onExit()
  }
  useSurfaceControls(controlsRoot,phase!=='playing'&&phase!=='help',45,escape,escape)
  useControlLayer({priority:50,enabled:phase==='playing',label:phase==='playing'?'Drop food':phase==='paused'&&!confirmExit?'Resume run':'Choose an option',canConfirm:phase==='playing'?state.ready:phase==='paused'&&!confirmExit,confirm:()=>{if(phase==='playing')drop();else if(phase==='paused'&&!confirmExit)setPhase('playing')},back:escape,menu:escape,move:phase==='playing'?(v,dt)=>moveAim(aimRef.current+v.x*150*dt):undefined})
  if(phase==='help')return <GameReader title="Pantry · How to play" paragraphs={['Aim left or right, then press A to drop. Match two identical foods to make something bigger. Keep the stack below the line. B pauses your run.', 'Practice stays on this device. Ranked runs can be posted after you review your initials and score. Your initials, score, highest food and date will be public. Posting is optional.', 'Ranked play uses a private 90-day browser cookie. Clearing cookies loses access to remove your posted score. Your saved best stays in this browser.']} onBack={()=>setPhase('intro')}/>
  return <div ref={controlsRoot} className={styles.pantry} data-ui-screen={`pantry-${phase}-${confirmExit}-${showSubmit}`} data-pantry-phase={phase} data-controller={true} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!e.repeat)escape()}}}>

    {phase==='board'?<Leaderboard onBack={()=>setPhase(boardReturn.current)}/>:<>
      {phase==='intro'&&<div className={styles.intro}>
        <h3>Pantry Drop</h3>
        <div className={styles.introArt} aria-hidden="true">{[0,3,5,8,9].map(tier=><FoodIcon key={tier} tier={tier} size={48}/>)}</div>
        <p>Drop food. Match a pair.<br/>Keep the pantry below the line.</p>
        <div className={styles.introStats}><span>Your best <strong>{number(best)}</strong></span><span>Island record <strong>{record===null?'Offline':record?number(record):'—'}</strong></span></div>
        <div className={styles.actions}><button data-autofocus className={styles.primary} onClick={()=>void start(false)}>Practice</button><button onClick={()=>void start(true)}>Ranked</button><button onClick={openBoard}>Records</button></div>
        <div className={styles.actions}><button onClick={()=>setPhase('help')}>How to play</button><button onClick={onExit}>B · Back</button></div>

      </div>}
      {phase==='loading'&&<p className={styles.empty} role="status">Setting the table…</p>}
      {active&&<div className={styles.playLayout}>
        <div className={styles.boardColumn}><div className={styles.scoreRow}><span>Score<strong>{number(state.score)}</strong></span><span>Your best<strong>{number(Math.max(best,state.score))}</strong></span><span>Island record<strong>{record===null?'—':record?number(record):'—'}</strong></span></div>
          <div className={styles.boardWrap}><canvas ref={canvas} width={BOARD.width} height={BOARD.height} className={styles.board} tabIndex={phase==='playing'?0:-1} aria-label="Pantry Drop board. Arrow keys aim; Space drops; Escape pauses." onKeyDown={key}
            onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointer(e);e.currentTarget.focus({preventScroll:true})}}
            onPointerMove={e=>{if(e.pointerType==='mouse'||e.buttons)pointer(e)}} onPointerUp={e=>{pointer(e);if(e.pointerType==='mouse'&&e.button===0)drop()}}/>
            {phase==='paused'&&<div data-game-modal className={styles.boardOverlay}><span className={styles.kicker}>TAKE YOUR TIME</span><h3>{confirmExit?'Leaving the cabinet?':'Paused'}</h3><p>{confirmExit?'Your current run will end. Your saved best stays.':'Your food is right where you left it.'}</p>{confirmExit?<button data-autofocus className={styles.primary} onClick={()=>{setConfirmExit(false);onKeep()}}>Keep run</button>:<><button data-autofocus className={styles.primary} onClick={()=>{setPhase('playing');canvas.current?.focus({preventScroll:true})}}>Resume</button><button onClick={finish}>Finish run</button><button onClick={()=>setConfirmExit(true)}>Leave run</button><button onClick={openBoard}>Records</button><button onClick={onSettings}>Settings</button></>}{confirmExit&&<button onClick={onExit}>Discard run and return</button>}</div>}
          </div>
          <p className={styles.boardNotice} role="status">{state.warning>0&&phase==='playing'?'Mind the line — the pantry is filling up.':notice||'Match two. Make something bigger.'}</p>
        </div>
        <aside className={styles.playAside}>
          {phase!=='result'?<><div className={styles.nextFood}><FoodIcon tier={state.current} size={54}/><div><span className={styles.kicker}>IN YOUR HAND</span><strong>{FOODS[state.current].name}</strong></div><div className={styles.nextSmall}><FoodIcon tier={state.next} size={30}/><span>Next · {FOODS[state.next].name}</span></div></div>
            <label className={styles.aimLabel} htmlFor="pantry-aim">Aim <span>{aim}</span></label><input id="pantry-aim" type="range" min={FOODS[state.current].radius} max={BOARD.width-FOODS[state.current].radius} value={aim} disabled={phase!=='playing'} onChange={e=>moveAim(Number(e.target.value))}/>
            <div className={styles.actions}><button className={styles.primary} disabled={phase!=='playing'||!state.ready} onClick={drop}>Drop food ↓</button><button disabled={phase!=='playing'} onClick={()=>setPhase('paused')}>Pause</button><button onClick={()=>sound.enabled?sound.mute():void sound.enable()} aria-label={sound.enabled?'Mute game sound':'Enable game sound'}>{sound.enabled?'Sound on':'Sound off'}</button></div>
            <p className={styles.note}>{isRanked?'Ranked run':'Practice · not posted'} · {Math.floor(state.tick/3600)}:{String(Math.floor(state.tick/60)%60).padStart(2,'0')} / 20:00</p>
            <button className={styles.subtle} onClick={openBoard}>Records ↗</button></>:<div className={styles.results}>
              <span className={styles.kicker}>{state.ended==='overflow'?'THE PANTRY IS FULL':'THAT’S A WRAP'}</span><h3>{number(state.score)} points</h3><p>{state.merges} merges · Reached {FOODS[state.highest].name}</p>
              {posted?<p role="status">Verified {number(posted.verifiedScore||0)} points. {posted.entry&&posted.entry.score>(posted.verifiedScore??0)?`Your best remains ${number(posted.entry.score)}. `:''}Your best ranks #{posted.entry?.rank} as {posted.entry?.initials}.</p>:isRanked&&state.score>0?<button onClick={()=>setShowSubmit(true)}>Submit score</button>:<p className={styles.note}>{isRanked?'Make a merge next time to join the board.':'Practice scores stay on this device.'}</p>}
              {showSubmit&&<form data-game-modal onSubmit={e=>{e.preventDefault();void submit()}}><label htmlFor="pantry-initials">Your three initials</label><div className={styles.initials} id="pantry-initials">{[0,1,2].map(i=><select key={i} aria-label={`Initial ${i+1}`} value={initials[i]||'A'} disabled={submitting} onChange={e=>setInitials(value=>value.slice(0,i)+e.target.value+value.slice(i+1))}>{'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('').map(character=><option key={character}>{character}</option>)}</select>)}</div><p className={styles.note}>Your initials, verified score, highest food and date will be public.</p><button className={styles.primary} disabled={submitting||initials.length!==3}>{submitting?'Checking your run…':'Post to leaderboard'}</button><button type="button" disabled={submitting} onClick={()=>setShowSubmit(false)}>Cancel</button></form>}
              <div className={styles.actions}><button className={styles.primary} disabled={submitting} onClick={()=>void start(!!ticket.current)}>Play again</button><button onClick={openBoard}>Records</button><button onClick={onExit}>Return to room</button></div>
            </div>}
          <details className={styles.evolution}><summary>The food ladder</summary><ol>{FOODS.map((food,i)=><li key={food.name}><FoodIcon tier={i} size={28}/><span>{food.name}</span><span>{food.points?`+${number(food.points)}`:'Start'}</span></li>)}</ol></details>
        </aside>
      </div>}
      {error&&<p className={styles.error} role="alert">{error}</p>}
    </>}
  </div>
}

'use client'
import { useRooms } from './CollectionData'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type PointerEvent } from 'react'
import { isRoom, isMediaRoom, mediaFormats,  ROOM_IDS } from '@/content/off-the-clock'
import { drawWorld, dark, light } from '@/lib/off-the-clock/draw'
import { buildings, buildingGeometry, contains, displayX, furnishings, HEIGHT, hotspots, movePlayer, pathToHotspot, pathToPoint, SPAWN, WIDTH, type Hotspot, type Point, type Scene } from '@/lib/off-the-clock/world'
import { preloadBuildingSprites, loadedBuildingSprites } from '@/lib/off-the-clock/building-sprites'
import dynamic from 'next/dynamic'
import { ActivityHost } from './ActivityHost'
import { useIslandSound } from './useIslandSound'
import { GameFrame } from './GameFrame'
import { BackIcon } from './Navigation'
import { ObjectInspector } from './ObjectInspector'
import { GameNotebook } from './GameNotebook'
import { GameControlsProvider, ControllerSettings, useControlLayer, useGameControls, useSurfaceControls } from './GameControls'
import { FixedGameScreen } from './FixedGameScreen'
import { TouchController } from './TouchController'
import retro from './RetroConsole.module.css'
import { WALK_SPEED, pointerToWorld, interactionTarget } from '@/lib/off-the-clock/game-input'
import ui from './GameUI.module.css'
import { MediaArtwork } from './MediaArtwork'
import styles from './OffTheClock.module.css'
import { IslandIntro } from './IslandIntro'
import { hasEnteredIsland, rememberIslandEntry, type IntroPhase } from '@/content/off-the-clock-intro'
import { advanceSceneClock, type SceneClock } from '@/lib/off-the-clock/scene-clock'
import { GameAssetLoader } from './GameAssetLoader'

const ListeningRoom = dynamic(() => import('./ListeningRoom'), { loading: () => <p>Setting up the turntable…</p> })

const PantryGame = dynamic(() => import('./pantry/PantryGame'), { loading: () => <p>Opening the cabinet…</p> })

const positionMemory = new Map<Scene, Point>()
const visits = new Set<string>()
const locationEvent = 'off-the-clock-location'
let guardNavigation: (()=>boolean)|undefined
function subscribe(listener: () => void) {
  const notify=()=>{if(!guardNavigation?.())listener()}
  window.addEventListener('popstate', notify); window.addEventListener('hashchange', notify); window.addEventListener(locationEvent, notify)
  return () => { window.removeEventListener('popstate', notify); window.removeEventListener('hashchange', notify); window.removeEventListener(locationEvent, notify) }
}
function snapshot() { return window.location.hash }
function serverSnapshot() { return '' }
function decodeSlug(value:string){try{return decodeURIComponent(value)}catch{return value}}
function go(scene: Scene, item?: string) {
  const hash = scene === 'island' && !item ? '' : `#${scene}${item ? `/${item}` : ''}`
  if (window.location.hash === hash) return
  window.history.pushState({ ...window.history.state, offTheClock: true }, '', `${window.location.pathname}${hash}`)
  window.dispatchEvent(new Event(locationEvent))
}

function InteractionMark({ active }: { active: boolean }) {
  return <span className={styles.interactionMark} data-active={active} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12V4a2 2 0 0 1 4 0v7-3a2 2 0 0 1 4 0v3-1a2 2 0 0 1 4 0v5c0 4-3 7-7 7h-2c-2 0-3-1-4-3l-4-6a2 2 0 0 1 3-2l2 2" /></svg></span>
}

const movementKeys = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'])

export default function Island() { return <GameAssetLoader><GameControlsProvider><IslandGame/></GameControlsProvider></GameAssetLoader> }

function IslandGame() {
  const rooms=useRooms()
  const { touchEnabled, active: activeControl } = useGameControls()
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const [introPhase, setIntroPhase] = useState<IntroPhase>(() => typeof window !== 'undefined' && (window.location.hash || hasEnteredIsland()) ? 'playing' : 'title')
  const introHash = useRef('')
  const [replaying, setReplaying] = useState(false)
  const introOpen = introPhase !== 'playing' && hash === introHash.current
  const inputAfter = useRef(0)
  const facingMemory = useRef(0)
  const sceneClock = useRef<SceneClock>({ elapsed: 0 })
  const [roomPart, itemPart, entryPart, slugPart] = hash.slice(1).split('/')
  const scene: Scene = isRoom(roomPart) ? roomPart : 'island'
  const sceneRef = useRef<Scene>(scene)
  useLayoutEffect(() => { sceneRef.current = scene }, [scene])
  const selected = (itemPart === 'journal' || scene!=='island'&&(/^item-[0-3]$/.test(itemPart ?? '') || itemPart === 'all') || itemPart === 'listen' && scene === 'music' || itemPart === 'pantry' && scene === 'games') ? itemPart : null
  const pantryClose = useRef<(() => void) | null>(null)
  const collectionClose = useRef<(() => void) | null>(null)
  const listeningReturn = useRef<string|null>(null)
  const turntableClose = useRef<(() => void) | null>(null)
  const runActive=useRef(false), pendingNavigation=useRef<string|null>(null), pendingTravel=useRef<Scene|null>(null)
  const [menu,setMenu] = useState<'main'|'map'|'settings'|'sound'|'controls'|null>(null)
  const activitySettings=useRef(false)
  const [pauseSignal,setPauseSignal] = useState(0)
  const [recordIndex,setRecordIndex] = useState(0)
  const originObject=useRef<string|null>(null)
  const travel=useRef<Scene|null>(null)
  const travelObject=useRef<string|null>(null)
  const notebookReturn=useRef<string|null>(null)
  const [inView, setInView] = useState(true)
  const activityOpen = !!selected || !!menu || introOpen
  const sound = useIslandSound(scene, !!selected || !inView)
  const soundCue = useRef(sound.cue)
  useEffect(() => { soundCue.current = sound.cue }, [sound.cue])
  const [, setHovered] = useState<string>()
  const [nearby, setNearby] = useState<Hotspot>()
  const [, setEngaged] = useState(false)
  const [motionPaused,setMotionPaused]=useState(false)
  const [zoom, setZoom] = useState(1)
  const [focused, setFocused] = useState(false)
  const [notice, setNotice] = useState('Tap the ground to walk. A hand marks an interactive object.')
  const [unavailable, setUnavailable] = useState(false)
  const [visitedCount, setVisitedCount] = useState(visits.size)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const player = useRef<Point>({ ...SPAWN })
  const keys = useRef(new Set<string>())
  const stick = useRef({x:0,y:0})
  const manualSource = useRef<'keys'|'stick'>('keys')
  const targetMemory = useRef<Hotspot | undefined>(undefined)
  const menuRef = useRef<HTMLElement>(null)
  const journey = useRef<{ points: Point[]; target?: Hotspot; scene: Scene } | null>(null)
  const [walkingTo, setWalkingTo] = useState<string>()
  const transition = useRef<{ started: number; from: Scene; to: Scene; id: string; start: Point; end: Point; committed: boolean } | null>(null)
  const feedback = useRef<{ point: Point; valid: boolean; until: number } | null>(null)
  const fadeRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ id: number; x: number; y: number; dragged: boolean } | null>(null)
  const suppressClick = useRef(false)

  useEffect(()=>{
    // Browser navigation is a new entry point; app-owned transitions use the
    // separate location event and retain their explicit return context.
    const externalNavigation=()=>{
      setMenu(null);activitySettings.current=false
      notebookReturn.current=null;listeningReturn.current=null
      keys.current.clear();stick.current={x:0,y:0}
      window.dispatchEvent(new Event('game-controller-reset'))
    }
    window.addEventListener('hashchange',externalNavigation)
    window.addEventListener('popstate',externalNavigation)
    return()=>{window.removeEventListener('hashchange',externalNavigation);window.removeEventListener('popstate',externalNavigation)}
  },[])

  const wakeWorld=useRef<()=>void>(()=>{})
  const cancelWalk = useCallback(() => { journey.current = null; setWalkingTo(undefined) }, [])
  useEffect(() => {
    if (introPhase === 'playing' || hash === introHash.current) return
    const id = requestAnimationFrame(() => { setIntroPhase('playing'); setReplaying(false) })
    return () => cancelAnimationFrame(id)
  }, [hash, introPhase])
  function finishIntro() {
    keys.current.clear(); cancelWalk(); transition.current = null; travel.current = null; gesture.current = null
    if (!replaying) { player.current = { ...SPAWN }; facingMemory.current = 3 }
    rememberIslandEntry()
    setIntroPhase('playing'); setReplaying(false)
    inputAfter.current = performance.now() + 400
    requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }))
  }
  function introAction(action: 'advance' | 'skip' | 'back') {
    if (performance.now() < inputAfter.current) return
    inputAfter.current = performance.now() + 350
    if (action === 'skip' || action === 'advance' && introPhase === 'arrival') { finishIntro(); return }
    if (action === 'back') {
      if (introPhase === 'title') { if (replaying) finishIntro(); else if (focused) setFocused(false); return }
      setIntroPhase(introPhase === 'arrival' ? 'sailing' : 'title')
    } else setIntroPhase(introPhase === 'title' ? 'sailing' : 'arrival')
  }
  function replayIntro() {
    keys.current.clear(); cancelWalk(); transition.current = null; travel.current = null; gesture.current = null
    introHash.current = hash
    setMenu(null); setReplaying(true); setIntroPhase('sailing')
    inputAfter.current = performance.now() + 350
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-intro-phase] h2')?.focus({ preventScroll: true }))
  }
  const onInteract = useCallback((target: Hotspot) => {
    if (performance.now() < inputAfter.current) return
    targetMemory.current = target
    window.dispatchEvent(new Event('game-controller-reset'))
    const scene = sceneRef.current
    keys.current.clear(); cancelWalk()
    if (transition.current) return
    if(target.id==='booth'){
      // Full document navigation removes the analytics shell before camera use.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/playground/offtheclock/booth');return
    }
    soundCue.current(target.room || target.id === 'exit' ? 'door' : 'open')
    if (target.room || target.id === 'exit') {
      const to = target.room ?? 'island'
      const b = buildings.find(b => b.id === (target.room ?? scene))
      if (to === 'island' && b) positionMemory.set('island', buildingGeometry(b).returnPoint)
      else positionMemory.set(to, { x: 240, y: 270 })
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { go(to); return }
      transition.current = { started: performance.now(), from: scene, to, id: target.id,
        start: { ...player.current }, end: target.room && b ? buildingGeometry(b).entry : { x: 240, y: 312 }, committed: false }
      setNotice(target.room ? `Entering ${rooms[target.room].name}…` : 'Returning to the island…')
    } else { originObject.current=target.id; notebookReturn.current=null; go(scene, target.id) }
  }, [cancelWalk, rooms])
  const onWalkTo = useCallback((target: Hotspot, action = target) => {
    const scene = sceneRef.current
    if (transition.current) return
    keys.current.clear()
    const points = pathToHotspot(scene, player.current, target)
    if (!points) { cancelWalk(); return }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || unavailable) {
      if (points.length) player.current = points[points.length - 1]
      onInteract(action); return
    }
    journey.current = { points, target: action, scene };wakeWorld.current()
    setWalkingTo(target.label)
    setMenu(null)
    canvasRef.current?.focus({ preventScroll: true })
  }, [onInteract, cancelWalk, unavailable])

  useEffect(()=>{if(scene==='film'&&itemPart==='booth'){const id=requestAnimationFrame(()=>onWalkTo(hotspots('film').find(h=>h.id==='booth')!));return()=>cancelAnimationFrame(id)}},[scene,itemPart,onWalkTo])

  const onArtworkClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 0 && suppressClick.current) return
    const target = hotspots(scene).find(h => h.id === event.currentTarget.dataset.hotspot)
    if (target) onWalkTo(target)
  }

  function pointerStart(event: PointerEvent<HTMLDivElement>) {
    if (performance.now() < inputAfter.current || Math.hypot(stick.current.x,stick.current.y)>0) return
    if (gesture.current || !event.isPrimary) { if (gesture.current) gesture.current.dragged = true; suppressClick.current = true; return }
    suppressClick.current = false
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false }
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    if (g && Math.hypot(event.clientX-g.x,event.clientY-g.y) > 8) { g.dragged = true; suppressClick.current = true }
  }
  function pointerEnd(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current
    gesture.current = null
    if (!g || g.id !== event.pointerId || g.dragged || transition.current || event.button !== 0) return
    if (event.target !== canvasRef.current) return
    travel.current=null
    const canvas = canvasRef.current!
    canvas.focus({ preventScroll: true })
    const rect = canvas.getBoundingClientRect()
    const z = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : zoom
    const cx = Math.round(Math.max(0, Math.min(WIDTH-WIDTH/z, player.current.x-WIDTH/z/2)))
    const cy = Math.round(Math.max(0, Math.min(HEIGHT-HEIGHT/z, player.current.y-HEIGHT/z/2)))
    const point = pointerToWorld({x:event.clientX,y:event.clientY},rect,{x:cx,y:cy},z)
    if(!point)return
    const target = hotspots(scene).find(h => contains(point,h,4))
    if (target) { onWalkTo(target); return }
    const points = pathToPoint(scene,player.current,point)
    keys.current.clear(); cancelWalk()
    feedback.current = { point: points?.at(-1) ?? point, valid: !!points, until: performance.now()+1400 }
    if (!points) { setNotice('That spot is blocked. Tap a clear part of the ground.'); return }
    setNotice('Walking to the marked spot. Tap elsewhere to change direction.')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (points.length) player.current = points[points.length-1]
      return
    }
    journey.current = { points, scene }
    setWalkingTo('marked spot')
  }

  useLayoutEffect(() => {
    if (transition.current && transition.current.from !== scene && transition.current.to !== scene) transition.current = null
    if(scene==='film'&&window.location.hash==='#film/return-booth')positionMemory.set('film',{x:417,y:214})
    player.current = positionMemory.get(scene) ?? (scene === 'island' ? { ...SPAWN } : { x: 240, y: 270 })
    keys.current.clear(); stick.current={x:0,y:0}; journey.current = null
    window.dispatchEvent(new Event('game-controller-reset'))
    return () => { positionMemory.set(scene, { ...player.current }) }
  }, [scene])

  useEffect(() => {
    if (scene !== 'island') visits.add(scene)
    const frame = requestAnimationFrame(() => { setWalkingTo(undefined); setVisitedCount(visits.size); setNearby(interactionTarget(scene, player.current, facingMemory.current, targetMemory.current)); setZoom(1) })
    return () => cancelAnimationFrame(frame)
  }, [scene])

  useEffect(() => { if (activityOpen) { keys.current.clear(); stick.current={x:0,y:0}; journey.current = null } }, [activityOpen])

  useEffect(() => {
    if (introOpen) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) {
      const id = requestAnimationFrame(() => setUnavailable(true))
      return () => cancelAnimationFrame(id)
    }
    let ambientLast = performance.now()
    let frame = 0, last = 0, lastDraw = 0, previousNear = '', facing = facingMemory.current, previousCamera = '', drawCount = 0, forceDraw = true, wasMoving = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let visible = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const heldKeys = keys.current
    const labels = layerRef.current?.querySelectorAll<HTMLElement>('[data-world-x]')
    const effectiveZoom = () => reduced.matches ? 1 : zoom
    const render = (now: number) => {
      frame = 0
      if (document.hidden || !visible || (activityOpen && lastDraw > 0)) { last = now; return }
      const moving = keys.current.size > 0 || Math.hypot(stick.current.x,stick.current.y)>0 || !!journey.current || !!transition.current
      if(moving!==wasMoving){forceDraw=true;wasMoving=moving}
      const ambient = !reduced.matches && !motionPaused
      if (!forceDraw && !moving && !ambient && !(feedback.current && feedback.current.until > now)) return
      if (moving) frame = requestAnimationFrame(render)
      else if (ambient || (feedback.current && feedback.current.until > now)) timer = setTimeout(()=>{frame=requestAnimationFrame(render)},125)
      if (!forceDraw && moving && now-lastDraw<32) return
      forceDraw = false
      const dt = Math.min((now - (last || now)) / 1000, .05)
      if (ambient && !activityOpen) advanceSceneClock(sceneClock.current, now-ambientLast)
      ambientLast = now
      last = now; lastDraw = now
      const previousPosition = player.current
      const pressed = keys.current
      let dx = Number(pressed.has('d') || pressed.has('arrowright')) - Number(pressed.has('a') || pressed.has('arrowleft'))
      let dy = Number(pressed.has('s') || pressed.has('arrowdown')) - Number(pressed.has('w') || pressed.has('arrowup'))
      if(manualSource.current==='stick' && Math.hypot(stick.current.x,stick.current.y)>0) { dx=stick.current.x;dy=stick.current.y }
      let walking = dx !== 0 || dy !== 0
      if (transition.current) { walking = false; dx = 0; dy = 0 }
      if (walking) {
        if (journey.current) cancelWalk()
        const horizontal=Math.abs(dx)>Math.abs(dy)*1.15, vertical=Math.abs(dy)>Math.abs(dx)*1.15
        if(horizontal)facing=dx>0?1:2
        else if(vertical)facing=dy<0?3:0
        const length = Math.max(1,Math.hypot(dx, dy)); dx /= length; dy /= length
        player.current = movePlayer(scene, player.current, dx * WALK_SPEED * dt, dy * WALK_SPEED * dt)
      }
      const trip = journey.current
      if (trip && trip.scene === scene) {
        let budget = WALK_SPEED * dt
        while (budget > .001 && trip.points.length) {
          const point = trip.points[0], vx = point.x-player.current.x, vy = point.y-player.current.y
          const distance = Math.hypot(vx,vy)
          if (distance < .001) { player.current = point; trip.points.shift(); continue }
          facing = Math.abs(vx)>Math.abs(vy) ? (vx>0?1:2) : (vy<0?3:0)
          const amount = Math.min(distance,budget)
          const next = movePlayer(scene,player.current,vx/distance*amount,vy/distance*amount)
          if (Math.hypot(next.x-player.current.x,next.y-player.current.y)<.000001) { cancelWalk(); break }
          player.current = next; budget -= amount; walking = true
          if (amount >= distance-.001) trip.points.shift()
        }
        if (journey.current === trip && !trip.points.length) { if (trip.target) onInteract(trip.target); else { cancelWalk(); setNotice('Arrived. Tap another spot or a marked object.'); } }
      }
      // Crossing an actual doorway also works with keys or a ground destination.
      if (!transition.current && walking) {
        const p = player.current
        const door = scene === 'island' && facing === 3 ? buildings.find(b => contains(p,buildingGeometry(b).trigger)) : undefined
        if (door) onInteract(hotspots(scene).find(h=>h.id===door.id)!)
        else if (scene !== 'island' && facing === 0 && p.y>=278 && Math.abs(p.x-240)<12) onInteract(hotspots(scene).find(h=>h.id==='exit')!)
      }
      const passage = transition.current
      let doorOpen = 0, doorId: string | undefined, opacity = 0
      if (passage) {
        const elapsed = now-passage.started
        if (!passage.committed && scene === passage.from) {
          doorId = passage.id; doorOpen = Math.min(1,elapsed/140)
          const progress = Math.max(0,Math.min(1,(elapsed-100)/220))
          player.current = { x: passage.start.x+(passage.end.x-passage.start.x)*progress, y: passage.start.y+(passage.end.y-passage.start.y)*progress }
          facing = passage.to === 'island' ? 0 : 3; walking = progress>0 && progress<1
          opacity = Math.max(0,Math.min(1,(elapsed-280)/140))
          if (elapsed>=420) { passage.committed = true; go(passage.to) }
        } else {
          opacity = Math.max(0,1-(elapsed-420)/180)
          if (elapsed>=600) { transition.current = null; setNotice('Tap the ground to walk. A hand marks an interactive object.') }
        }
      }
      if (fadeRef.current) fadeRef.current.style.opacity = String(opacity)
      canvas.dataset.transitioning = passage ? 'true' : 'false'
      canvas.dataset.doorId = doorId ?? ''
      canvas.dataset.doorOpen = doorOpen.toFixed(2)
      canvas.dataset.buildingSprites = loadedBuildingSprites()
      canvas.dataset.walkingTo = journey.current ? journey.current.target?.id ?? 'ground' : ''
      const target = interactionTarget(scene, player.current, facing, targetMemory.current)
      targetMemory.current = target
      if ((target?.id ?? '') !== previousNear) { previousNear = target?.id ?? ''; setNearby(target) }
      // Position semantic labels and real cover images in world coordinates. Only
      // their bounds move with the camera; text is always browser-rendered.
      const z = effectiveZoom()
      const cx = Math.round(Math.max(0, Math.min(WIDTH - WIDTH / z, player.current.x - WIDTH / z / 2)))
      const cy = Math.round(Math.max(0, Math.min(HEIGHT - HEIGHT / z, player.current.y - HEIGHT / z / 2)))
      const cameraKey = `${cx}:${cy}:${z}`
      labels?.forEach(label => {
        const objectId = label.dataset.hotspot
        if (objectId) { const interaction = selected === objectId ? 'active' : journey.current?.target?.id === objectId ? 'walking' : target?.id === objectId ? 'nearby' : 'idle'; if(label.dataset.interaction!==interaction)label.dataset.interaction=interaction }
        if(cameraKey===previousCamera)return
        label.style.left = `${(Number(label.dataset.worldX) - cx) * z / WIDTH * 100}%`
        label.style.top = `${(Number(label.dataset.worldY) - cy) * z / HEIGHT * 100}%`
        if (label.dataset.worldW) label.style.width = `${Number(label.dataset.worldW) * z / WIDTH * 100}%`
        if (label.dataset.worldH) label.style.height = `${Number(label.dataset.worldH) * z / HEIGHT * 100}%`
      })
      previousCamera=cameraKey
      canvas.dataset.drawCount=String(++drawCount)
      facingMemory.current = facing
      walking = walking && Math.hypot(player.current.x-previousPosition.x,player.current.y-previousPosition.y) > .001
      canvas.dataset.facing = String(facing)
      canvas.dataset.walking = String(walking)
      canvas.dataset.catSprite = 'native'
      canvas.dataset.sceneTime = String(Math.round(sceneClock.current.elapsed))
      if (walking) soundCue.current('step')
      canvas.dataset.nearby = target?.id ?? ''
      canvas.dataset.playerX = player.current.x.toFixed(1)
      canvas.dataset.playerY = player.current.y.toFixed(1)
      ctx.setTransform(4,0,0,4,0,0)
      drawWorld(ctx, scene, player.current, document.documentElement.dataset.theme === 'dark' ? dark : light,
        reduced.matches ? 0 : now, walking && !reduced.matches, facing, effectiveZoom(), target?.id, { buildingArt:true, doorId, doorOpen, ambientTick: sceneClock.current.elapsed, ambientPaused: motionPaused || reduced.matches, marker: feedback.current && feedback.current.until > now ? feedback.current : undefined })
    }
    const wake = () => {
      clearTimeout(timer);cancelAnimationFrame(frame);forceDraw=true;last=performance.now();ambientLast=last
      if(!document.hidden&&visible)frame=requestAnimationFrame(render)
    }
    wakeWorld.current=wake
    let disposed = false
    void preloadBuildingSprites().then(()=>{if(!disposed)wake()})
    const clear = () => { keys.current.clear(); stick.current={x:0,y:0}; cancelWalk(); wake() }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; setInView(visible); if (!visible) clear(); else wake() })
    const themeObserver=new MutationObserver(wake)
    themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})
    observer.observe(canvas)
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear)
    window.addEventListener('keydown',wake);window.addEventListener('pointerdown',wake);window.addEventListener('click',wake);reduced.addEventListener('change',wake)
    frame = requestAnimationFrame(render)
    return () => { disposed=true;wakeWorld.current=()=>{};clearTimeout(timer);cancelAnimationFrame(frame);observer.disconnect();themeObserver.disconnect();heldKeys.clear();window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);window.removeEventListener('keydown',wake);window.removeEventListener('pointerdown',wake);window.removeEventListener('click',wake);reduced.removeEventListener('change',wake) }
  }, [scene, selected, activityOpen, introOpen, zoom, motionPaused, onInteract, cancelWalk])

  useEffect(()=>{
    const check=()=>{
      if(selected!=='pantry'||!runActive.current||window.location.hash===hash)return false
      pendingNavigation.current=window.location.hash
      window.history.pushState({...window.history.state,offTheClock:true},'',`${window.location.pathname}${hash}`)
      pantryClose.current?.()
      return true
    }
    guardNavigation=check
    return()=>{if(guardNavigation===check)guardNavigation=undefined}
  },[hash,selected])
  useEffect(()=>{
    if(!menu)return
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
    const id=requestAnimationFrame(()=>{window.dispatchEvent(new Event('cursor-surface-change'))})
    return()=>{cancelAnimationFrame(id);requestAnimationFrame(()=>{if(previous?.isConnected&&!previous.closest('[inert]'))previous.focus({preventScroll:true});window.dispatchEvent(new Event('cursor-surface-change'))})}
  },[menu])
  function closeMenu() {
    if(menu==='sound'||menu==='controls'){setMenu('settings');return}
    if(menu==='settings'&&activitySettings.current){activitySettings.current=false;setMenu(null);return}
    setMenu(menu==='main'?null:'main')
  }
  function closePanel() {
    if(menu){closeMenu();return}
    if(activeControl && activeControl.priority>20 && activeControl.get().back){activeControl.get().back?.();return}
    if(selected==='pantry' && pantryClose.current){pantryClose.current();return}
    if(selected==='listen' && turntableClose.current){turntableClose.current();return}
    if((selected==='journal'||selected==='all') && collectionClose.current){collectionClose.current();return}
    if(selected==='journal' && entryPart){if(window.history.state?.offTheClock)window.history.back();else replaceSelection('journal');return}
    leavePanel()
  }
  function replaceSelection(item?:string) {
    window.history.replaceState(window.history.state,'',`${window.location.pathname}#${scene}${item?'/'+item:''}`)
    window.dispatchEvent(new Event(locationEvent))
  }
  function leavePanel() {
    if(selected==='pantry'){
      runActive.current=false
      const destination=pendingNavigation.current;pendingNavigation.current=null
      if(destination!==null){window.history.replaceState(window.history.state,'',`${window.location.pathname}${destination}`);window.dispatchEvent(new Event(locationEvent));return}
      if(pendingTravel.current){const target=pendingTravel.current;pendingTravel.current=null;replaceSelection();requestAnimationFrame(()=>beginTravel(target));return}
    }
    if(selected==='listen' && listeningReturn.current){const origin=listeningReturn.current;listeningReturn.current=null;replaceSelection(origin);return}
    if(selected==='journal' && notebookReturn.current){const back=notebookReturn.current;notebookReturn.current=null;if(back==='pause'){replaceSelection();setMenu('main')}else replaceSelection(back);return}
    replaceSelection()
    requestAnimationFrame(()=>{layerRef.current?.querySelector<HTMLElement>(`[data-hotspot="${originObject.current}"]`)?.focus({preventScroll:true});window.dispatchEvent(new Event('cursor-surface-change'))})
  }
  function openNotebook() {
    notebookReturn.current=selected??'pause';setMenu(null);keys.current.clear();cancelWalk();replaceSelection('journal')
  }
  function toggleMenu(){keys.current.clear();cancelWalk();setPauseSignal(v=>v+1);setMenu(m=>m?null:'main')}
  function back(){
    if(introOpen){introAction('back');return}
    if(menu||selected){closePanel();return}
    if(journey.current){travel.current=null;cancelWalk()}
    toggleMenu()
  }
  function navigateRoom(destination:Scene) {
    if(selected==='pantry'){pendingTravel.current=destination;setMenu(null);pantryClose.current?.();return}
    if(selected)replaceSelection()
    beginTravel(destination)
  }
  function beginTravel(destination:Scene,objectId:string|null=null) {
    travelObject.current=objectId
    setMenu(null);travel.current=destination
    if(destination===scene){travel.current=null;return}
    if(scene==='island')onWalkTo(hotspots(scene).find(h=>h.id===destination)!)
    else onWalkTo(hotspots(scene).find(h=>h.id==='exit')!)
  }
  useEffect(()=>{
    if(!travel.current)return
    const id=setTimeout(()=>{
      const destination=travel.current
      if(!destination)return
      if(scene===destination){travel.current=null;const target=hotspots(scene).find(h=>h.id===travelObject.current);travelObject.current=null;if(target)onWalkTo(target);return}
      if(scene==='island' && destination!=='island')onWalkTo(hotspots('island').find(h=>h.id===destination)!)
    },650)
    return()=>clearTimeout(id)
  },[scene,onWalkTo])

  function reset() {
    player.current = scene === 'island' ? { ...SPAWN } : { x: 240, y: 270 }
    keys.current.clear(); cancelWalk(); canvasRef.current?.focus({ preventScroll: true })
  }

  const room = scene === 'island' ? null : rooms[scene]
  const view = selected ? selected.startsWith('item-') ? 'inspect' : selected==='journal'||selected==='all' ? 'notebook' : 'activity' : 'explore'
  useControlLayer({priority:0,enabled:!activityOpen,label:nearby?.label || 'Find a door or an object',canConfirm:!!nearby,
    confirm:()=>{const target=interactionTarget(scene,player.current,facingMemory.current,targetMemory.current);if(target){stick.current={x:0,y:0};keys.current.clear();onInteract(target)}},back,menu:toggleMenu,
    move:v=>{if(transition.current||performance.now()<inputAfter.current)return
      if(stick.current.x!==v.x||stick.current.y!==v.y){stick.current=v;if(Math.hypot(v.x,v.y)>0){manualSource.current='stick';travel.current=null;cancelWalk()}wakeWorld.current()}
    },
  })
  useSurfaceControls(menuRef,!!menu,100,closeMenu,()=>setMenu(null))
  return <GameFrame focused={focused} onBack={back}>
    <div className={styles.worldBar} data-frame-chrome>
      <nav className={styles.breadcrumb} aria-label="Game location">
        {!introOpen&&(scene!=='island'||selected)&&<button className={styles.iconLink} aria-label={selected?'Back to the room':'Back to the island'} title="Back" onClick={()=>selected?closePanel():navigateRoom('island')}><BackIcon/></button>}
        <span>Off the Clock</span>{!introOpen&&<><span aria-hidden>/</span><span aria-current="location">{room?.name??'Island'}</span></>}{selected&&<><span aria-hidden>/</span><span>{selected==='booth'?'Photo booth':selected==='pantry'?'Pantry Drop':selected==='listen'?'Turntable':selected==='journal'||selected==='all'?'Collections':'Inspect'}</span></>}
      </nav>
      <div className={styles.worldActions}>
        {!introOpen&&<><button aria-label={sound.enabled?'Mute all sound':'Sound settings'} title="Sound" onClick={()=>{if(sound.enabled)sound.mute();else{setPauseSignal(v=>v+1);setMenu('sound')}}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d={sound.enabled?'M15 8q5 4 0 8':'m16 9 6 6m0-6-6 6'}/></svg></button>
        <button aria-label="Game menu" title="Menu" aria-expanded={!!menu} onClick={toggleMenu}>☰</button></>}
        <button aria-label={focused?'Exit Focus view':'Enter Focus view'} title={focused?'Exit Focus view':'Enter Focus view'} aria-pressed={focused} onClick={()=>{setPauseSignal(v=>v+1);setFocused(f=>!f)}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d={focused?'M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5':'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'}/></svg></button>
      </div>
    </div>
    <div className={retro.console}>
    <FixedGameScreen view={introOpen?'intro':view}>
    <div className={styles.stage} data-scene={scene} inert={activityOpen} onPointerDownCapture={pointerStart} onPointerMoveCapture={pointerMove} onPointerUpCapture={pointerEnd} onPointerCancelCapture={() => { gesture.current = null; suppressClick.current = true }} onClickCapture={event => { if (event.detail > 0 && suppressClick.current) { event.preventDefault(); event.stopPropagation() } }}>
      <canvas ref={canvasRef} width={WIDTH * 4} height={HEIGHT * 4} tabIndex={0}
        aria-describedby="island-controls" role="img" aria-label={`${room?.place ?? 'Pixel island'}. Interactive scene. Focus to walk with arrow keys; accessible room and collection controls follow below.`}
        className={styles.world}
        onFocus={() => setEngaged(true)} onBlur={() => { keys.current.clear(); setEngaged(false) }}
        onKeyDown={event => {
          const key = event.key.toLowerCase()
          if (transition.current || performance.now() < inputAfter.current || event.repeat && (key === 'enter' || key === 'e')) { event.preventDefault(); return }
          if (movementKeys.has(key)) { event.preventDefault(); travel.current=null; keys.current.add(key);manualSource.current='keys';wakeWorld.current() }
          else if (key === 'e' || key === 'enter') { event.preventDefault(); const target = interactionTarget(scene, player.current, facingMemory.current, targetMemory.current); if (target && !event.repeat) onInteract(target) }
          else if (key === 'escape') { event.preventDefault();event.stopPropagation();back() }
        }}
        onKeyUp={event => { keys.current.delete(event.key.toLowerCase()) }}

      >Explore Homelab, Music, Film, and Games using the links below.</canvas>
      <div ref={fadeRef} className={styles.doorFade} aria-hidden="true" />
      <div className={styles.compass} aria-hidden><span>N</span><span>↑</span></div>
      {unavailable && <div className={styles.sceneMessage}>The interactive view isn’t available. All collections are linked below.</div>}
      <div ref={layerRef} className={styles.sceneLayer} aria-label={scene === 'island' ? 'Island buildings' : 'Room displays'}>
        {scene === 'island' ? buildings.map(b => {
          const {visual}=buildingGeometry(b)
          return <button key={b.id} className={styles.objectTarget}
          data-hotspot={b.id} onMouseEnter={() => setHovered(b.id)} onMouseLeave={() => setHovered(undefined)} onFocus={() => setHovered(b.id)} onBlur={() => setHovered(undefined)} data-world-x={visual.x} data-world-y={visual.y} data-world-w={visual.w} data-world-h={visual.h}
          style={{ left: `${visual.x / WIDTH * 100}%`, top: `${visual.y / HEIGHT * 100}%`, width: `${visual.w / WIDTH * 100}%`, height: `${visual.h / HEIGHT * 100}%` }}
          onClick={() => onWalkTo(hotspots(scene).find(h => h.id === b.id)!)} aria-label={`Enter ${rooms[b.id].name}`}><span style={{position:'absolute',right:0,bottom:0,transform:'translate(25%, 25%)'}}><InteractionMark active={nearby?.id === b.id} /></span></button>
        }) : <>
          {isMediaRoom(scene) && [0, 1, 2, 3].map(i => {
            const format = mediaFormats[scene]
            const item = rooms[scene].favorites[i]
            const x = displayX(scene, i)
            return <button key={item?.id ?? i} className={styles.wallDisplay} data-room={scene}
              data-world-x={x} data-world-y={format.top} data-world-w={format.width} data-world-h={format.height}
              style={{ left: `${x / WIDTH * 100}%`, top: `${format.top / HEIGHT * 100}%`, width: `${format.width / WIDTH * 100}%`, height: `${format.height / HEIGHT * 100}%` }}
              data-hotspot={`item-${i}`} onMouseEnter={() => setHovered(`item-${i}`)} onMouseLeave={() => setHovered(undefined)} onFocus={() => setHovered(`item-${i}`)} onBlur={() => setHovered(undefined)} onClick={onArtworkClick} aria-label={`Inspect ${item?.title ?? `favorite ${i + 1}`}`}>
              <MediaArtwork room={scene} item={item} eager /><InteractionMark active={nearby?.id === `item-${i}`} />
            </button>
          })}
          {hotspots(scene).filter(h => h.id === 'exit' || h.id === 'journal' || h.id === 'listen' || h.id === 'pantry' || h.id === 'booth' || scene === 'homelab').map(h => {
            const object = h.id === 'booth' ? furnishings.film.find(o=>o.kind==='booth') : h.id === 'pantry' ? furnishings.games.find(o => o.kind === 'cocktail') : h.id === 'listen' ? furnishings.music.find(o => o.kind === 'turntable') : h.id === 'journal' ? furnishings[scene].find(o => o.kind === 'journal') :
              scene === 'homelab' && h.item !== undefined ? furnishings[scene][h.item] : undefined
            const x = object?.x ?? h.x, y = object ? object.y - object.rise : h.id === 'exit' ? 281 : h.y
            const w = object?.w ?? h.w, height = object ? object.h + object.rise : h.id === 'exit' ? 40 : h.h
            return <button key={h.id} className={styles.objectTarget} data-hotspot={h.id} onMouseEnter={() => setHovered(h.id)} onMouseLeave={() => setHovered(undefined)} onFocus={() => setHovered(h.id)} onBlur={() => setHovered(undefined)}
              data-world-x={x} data-world-y={y} data-world-w={w} data-world-h={height}
              style={{ left: `${x / WIDTH * 100}%`, top: `${y / HEIGHT * 100}%`, width: `${w / WIDTH * 100}%`, height: `${height / HEIGHT * 100}%` }}
              onClick={() => onWalkTo(h)} aria-label={h.label}><InteractionMark active={nearby?.id === h.id} /></button>
          })}
        </>}
      </div>
    </div>
    {introOpen&&<IslandIntro clock={sceneClock.current} motionPaused={motionPaused} onToggleMotion={()=>setMotionPaused(v=>!v)} phase={introPhase as Exclude<IntroPhase,'playing'>} sound={sound} replaying={replaying} onAdvance={()=>introAction('advance')} onSkip={()=>introAction('skip')} onBack={()=>introAction('back')}/>}
    <div inert={!!menu||introOpen} style={{display:'contents'}}>
      <ActivityHost fitted={selected==='listen'||selected==='pantry'} open={!!selected} mode={view==='inspect'?'inspect':view==='notebook'?'notebook':'activity'} onClose={closePanel} title={selected==='booth'?'Photo booth':selected==='pantry'?'Pantry Drop':selected==='listen'?'At the turntable':selected==='journal'||selected==='all'?'Collections':room?.place??'Off the Clock'}>
        {selected==='pantry'?<PantryGame onSettings={()=>{activitySettings.current=true;setMenu('settings')}} sound={sound} onExit={leavePanel} closeRequest={pantryClose} pauseSignal={pauseSignal} runActive={runActive} onKeep={()=>{pendingNavigation.current=null;pendingTravel.current=null}}/>:selected==='listen'?<ListeningRoom onMenu={toggleMenu} sound={sound} initialIndex={recordIndex} startAtPlayer={!!listeningReturn.current} closeRequestRef={turntableClose} suspended={!!menu||!inView} onExit={leavePanel}/>:(selected==='journal'||selected==='all')?<GameNotebook room={isMediaRoom(scene)?scene:'music'} entryRoom={isMediaRoom(entryPart)?entryPart:undefined} entrySlug={entryPart?decodeSlug(slugPart??entryPart):undefined} onEntry={(slug,tab)=>{if(slug)go(scene,`journal/${tab??scene}/${encodeURIComponent(slug)}`);else if(entryPart)replaceSelection('journal')}} onBack={leavePanel} sound={sound} suspended={!!menu||!inView} closeRequestRef={collectionClose}/>:scene!=='island'?<ObjectInspector onMenu={toggleMenu} room={scene} index={selected?.startsWith('item-')?Number(selected.slice(-1)):0} onIndex={i=>replaceSelection(`item-${i}`)} onDone={leavePanel} onJournal={openNotebook} onListen={i=>{setRecordIndex(i);listeningReturn.current=`item-${i}`;replaceSelection('listen')}}/>:null}
      </ActivityHost>
    </div>
    {menu&&<><button className={ui.menuBackdrop} aria-label="Close game menu" onClick={()=>setMenu(null)}/><section ref={menuRef} data-ui-screen={`menu-${menu}`} className={ui.menu} aria-label="Game menu panel" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeMenu()}}}>
      <div className={ui.menuHeader}><h2>{menu==='main'?'Paused':menu==='map'?'Island map':menu==='sound'?'Sound':menu==='settings'?'Settings':'Controls'}</h2><button aria-label="Back from game menu" onClick={closePanel}>←</button></div>
      {menu==='main'?<div className={ui.menuItems}>
        <button data-autofocus onClick={()=>setMenu(null)}>▸ Resume</button>
        <button disabled={selected==='pantry'} onClick={openNotebook}>Collections <span>›</span></button>
        <button onClick={()=>setMenu('map')}>Island map <span>›</span></button>
        <button onClick={()=>setMenu('settings')}>Settings <span>›</span></button>
        <button onClick={()=>{setMenu(null);setFocused(false);document.getElementById('collections')?.scrollIntoView({behavior:'smooth'})}}>Return to website <span>↗</span></button>
      </div>:menu==='settings'?<div className={ui.menuItems}>
        <button data-autofocus onClick={()=>setMenu('sound')}>Sound <span>›</span></button><button onClick={()=>setMenu('controls')}>Controls <span>›</span></button>
        <button aria-pressed={!motionPaused} onClick={()=>setMotionPaused(v=>!v)}>Ambient motion <span>{motionPaused?'Off':'On'}</span></button>
        <button disabled={!!selected} onClick={replayIntro}>Replay story <span>↺</span></button>
      </div>:menu==='map'?<><p>{visitedCount} of 4 places visited</p><div className={ui.menuItems}>{ROOM_IDS.map(id=><button key={id} onClick={()=>navigateRoom(id)}>{rooms[id].name}<span>{scene===id?'You are here':'›'}</span></button>)}</div></>:menu==='sound'?<><button data-autofocus className={ui.primary} onClick={()=>sound.enabled?sound.mute():void sound.enable()}>{sound.enabled?'Sound on · Mute':'Sound off · Enable'}</button>{(['music','effects'] as const).map(key=><label key={key}>{key==='music'?'Background music':'Sound effects'} · {sound.levels[key]}%<input aria-label={key==='music'?'Background music':'Sound effects'} type="range" min="0" max="100" step="5" value={sound.levels[key]} onChange={e=>sound.change(key,Number(e.target.value))}/></label>)}{sound.error&&<p role="status">{sound.error}</p>}<p>← → Adjust · B Back</p></>:<><ControllerSettings/><p>A selects · B returns or pauses<br/>← → Adjust a setting</p><div className={ui.menuItems}><button aria-label={zoom===1?'Zoom in on the island':'Show the whole island'} onClick={()=>setZoom(z=>z===1?2:1)}>{zoom===1?'World view · 1×':'World view · 2×'}</button><button disabled={!!selected} onClick={()=>{travel.current=null;reset();setMenu(null)}}>Reset my position</button></div></>}

    </section></>}
    </FixedGameScreen>
    <TouchController/>
    </div>
    <div className={styles.controlBar} data-frame-chrome style={introOpen || touchEnabled ? { display: 'none' } : undefined}>
      {introOpen?<span aria-hidden> </span>:!selected?<><span className={styles.desktopHint}>{walkingTo?`Walking to ${walkingTo.replace(/^Enter /,'')}…`:notice}</span><button className={styles.interact} disabled={!nearby||!!menu} onClick={()=>nearby&&onInteract(nearby)}><kbd>E</kbd><span>{nearby?.label??'Find a door. Follow your curiosity.'}</span></button>{walkingTo&&<button aria-label="Cancel walk" onClick={()=>{travel.current=null;cancelWalk()}}>×</button>}</>:<span>{selected==='pantry'?'Aim · Drop · Make something bigger.':selected==='listen'?'Choose a record. Stay a while.':selected==='journal'||selected==='all'?'A few things worth keeping.':'Take a closer look.'}</span>}
    </div>

    <span id="island-controls" className="sr-only">Use arrow keys or WASD to walk, E to interact, and Tab to choose objects. Click or tap an object to walk to it. Ambient motion can be paused in the game Controls menu.</span>
    <span className="sr-only" role="status" aria-live="polite" aria-hidden={introOpen}>{room ? `Inside ${room.place}.` : 'On the island.'} {nearby?.label ?? ''} {notice}</span>
  </GameFrame>
}

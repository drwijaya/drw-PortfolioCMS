'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { introSlides, type IntroPhase } from '@/content/off-the-clock-intro'
import type { SceneClock } from '@/lib/off-the-clock/scene-clock'
import type { SoundControls } from './useIslandSound'
import { TitleScene } from './TitleScene'
import { StoryScene } from './StoryScene'
import { PixelDialogue } from './PixelDialogue'
import type { TextSpeed } from './useTypewriter'
import { ControllerSettings, useSurfaceControls } from './GameControls'
import styles from './IslandIntro.module.css'

const artwork = '/img/off-the-clock/intro/illustrated/'
const prepared = new Map<string, Promise<void>>()
function prepareArtwork(name: string) {
  let promise = prepared.get(name)
  if (!promise) {
    promise = new Promise<void>(resolve => {
      const image = new Image()
      const timeout = setTimeout(resolve, 1500)
      image.src = artwork + name
      void image.decode().catch(() => {}).finally(() => { clearTimeout(timeout); resolve() })
    })
    prepared.set(name, promise)
  }
  return promise
}
type Props = { phase: Exclude<IntroPhase, 'playing'>; sound: SoundControls; clock: SceneClock; motionPaused: boolean; onToggleMotion: () => void; replaying: boolean; onAdvance: () => void; onSkip: () => void; onBack: () => void }
export function IslandIntro({ phase, sound, clock, motionPaused, onToggleMotion, replaying, onAdvance, onSkip, onBack }: Props) {
  const [settings, setSettings] = useState(false)
  const [speed, setSpeed] = useState<TextSpeed>('normal')
  const [textSound, setTextSound] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [active, setActive] = useState(true)
  const [leaving, setLeaving] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [settled, setSettled] = useState('')
  const surface = useRef<HTMLElement>(null)
  const settingsPanel = useRef<HTMLElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const restoreSettingsFocus = useRef(false)
  const action = useRef<(() => void) | null>(null)
  const [seen, setSeen] = useState(() => new Set<string>())
  const transition = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const busy = useRef(false)
  const navigation = useRef(0)
  const alive = useRef(false)
  const title = phase === 'title'
  const slide = introSlides[phase === 'arrival' ? 'arrival' : 'sailing']
  const still = motionPaused || reduced
  const effectiveSpeed = reduced ? 'instant' : speed
  useEffect(() => {
    alive.current = true
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    const id = requestAnimationFrame(() => {
      change()
      try { const stored = JSON.parse(localStorage.getItem('off-clock-opening') || '{}'); if (['normal','fast','instant'].includes(stored.speed)) setSpeed(stored.speed); if (typeof stored.textSound === 'boolean') setTextSound(stored.textSound) } catch {}
    })
    media.addEventListener('change', change)
    let visible = true
    const visibility = () => setActive(visible && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visibility() })
    if (surface.current) observer.observe(surface.current)
    document.addEventListener('visibilitychange', visibility)
    return () => { cancelAnimationFrame(id); observer.disconnect(); media.removeEventListener('change', change); document.removeEventListener('visibilitychange', visibility); clearTimeout(transition.current); alive.current = false }
  }, [])
  useEffect(() => {
    const id = requestAnimationFrame(() => { busy.current = false; setLeaving(false) })
    // Warm the next scene without blocking the title or downloading runtime art externally.
    void prepareArtwork(title ? 'sailing.webp' : 'arrival.webp')
    return () => cancelAnimationFrame(id)
  }, [phase, title])
  useLayoutEffect(() => {
    if (settings) closeButton.current?.focus()
    else if (restoreSettingsFocus.current) { restoreSettingsFocus.current = false; settingsButton.current?.focus({preventScroll:true}) }
  }, [settings])
  const save = (nextSpeed: TextSpeed, nextSound: boolean) => {
    setSpeed(nextSpeed); setTextSound(nextSound)
    try { localStorage.setItem('off-clock-opening', JSON.stringify({ speed: nextSpeed, textSound: nextSound })) } catch {}
  }
  const navigate = useCallback((callback: () => void, next?: string) => {
    if (busy.current && next) return
    const token = ++navigation.current
    clearTimeout(transition.current)
    busy.current = true
    const run = async () => {
      if (next) { setPreparing(true); await prepareArtwork(next) }
      if (!alive.current || token !== navigation.current) return
      setPreparing(false); setSeen(previous => new Set(previous).add(phase)); setLeaving(true)
      sound.cue('confirm')
      transition.current = setTimeout(() => { callback(); busy.current = false; setLeaving(false) }, still ? 0 : 180)
    }
    void run()
  }, [phase, sound, still])
  const advance = useCallback(() => navigate(onAdvance, phase === 'title' ? 'sailing.webp' : phase === 'sailing' ? 'arrival.webp' : undefined), [navigate, onAdvance, phase])
  const tick = useCallback(() => { if (textSound && active && !settings && !leaving) sound.cue('text') }, [sound, textSound, active, settings, leaving])
  const closeSettings = () => { restoreSettingsFocus.current = true; setSettings(false) }
  useSurfaceControls(surface,title&&!settings&&!leaving&&!preparing,30,()=>{})
  useSurfaceControls(settingsPanel,settings,120,closeSettings,closeSettings)
  return <section ref={surface} className={styles.intro} data-intro-phase={phase} data-still={still} data-active={active && !settings} data-cursor="hide" data-leaving={leaving} aria-label="Off the Clock introduction" onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!event.repeat) { if (settings) closeSettings(); else navigate(onBack) } }
    if (event.key !== 'Enter' && event.key !== ' ') return
    if (event.repeat) { event.preventDefault(); return }
    if (settings || leaving || event.target instanceof Element && event.target.closest('button,select,input,a')) return
    event.preventDefault(); event.stopPropagation()
    if (title) advance(); else action.current?.()
  }}>
    <div className={styles.presentation} inert={settings || leaving}>
      {title ? <div className={styles.titleScreen}>
        <TitleScene clock={clock} paused={still || !active || settings}/>
        <h2 className={styles.title} tabIndex={-1}>Off the Clock</h2>
        <StoryScene src={artwork + 'title-island.webp'} title description="A tabby in a rowboat approaches an island with four little places to explore."/>
        <div className={styles.entry}><button data-autofocus className={styles.primary} onClick={advance}><span className={styles.marker} aria-hidden="true">▸</span> Tap to explore</button><span className={styles.keyHint}>ENTER</span></div>
      </div> : <>
        <div className={styles.scene}>
          <StoryScene key={phase} src={artwork + slide.image} description={slide.description} onSettled={() => setSettled(phase)}/>
        </div>
        <PixelDialogue key={phase} text={slide.lines.join('\n')} speed={effectiveSpeed} paused={!active || settings || leaving || preparing || settled !== phase} seen={seen.has(phase)} arrival={phase === 'arrival'} replaying={replaying} onTick={tick} onAdvance={advance} onBack={() => navigate(onBack)} onSkip={() => navigate(onSkip)} onMenu={()=>setSettings(true)} actionRef={action}/>
      </>}
      <button ref={settingsButton} className={styles.settingsButton} aria-label="Opening settings" aria-expanded={settings} onClick={() => setSettings(true)}>Settings</button>
    </div>
    {settings && <div className={styles.settingsShade}><section ref={settingsPanel} className={styles.settingsPanel} role="dialog" aria-modal="false" aria-label="Opening settings">
      <header><h2>Settings</h2><button ref={closeButton} aria-label="Close settings" onClick={closeSettings}>×</button></header>
      <button aria-pressed={sound.enabled} onClick={() => sound.enabled ? sound.mute() : void sound.enable()}>Sound <span>{sound.enabled ? 'On' : 'Off'}</span></button>
      <button aria-pressed={textSound} onClick={() => save(speed, !textSound)}>Text sound <span>{textSound ? 'On' : 'Off'}</span></button>
      <ControllerSettings/>
      <label>Text speed <select aria-label="Text speed" value={speed} onChange={e => save(e.target.value as TextSpeed, textSound)}><option value="normal">Normal</option><option value="fast">Fast</option><option value="instant">Instant</option></select></label>
      <label>Effects volume <input aria-label="Sound effects" type="range" min="0" max="100" value={sound.levels.effects} onChange={e => sound.change('effects', Number(e.target.value))}/></label>
      <button aria-pressed={motionPaused} onClick={onToggleMotion}>Ambient motion <span>{still ? 'Paused' : 'On'}</span></button>
      {reduced && <p>Reduced motion is active. Text appears instantly.</p>}
      <p>Tap or press Enter to complete text, then again to continue. On the island: tap to walk, or use arrows / WASD. E interacts.</p>
      {sound.error && <p role="status">{sound.error}</p>}
      <button className={styles.skip} onClick={() => navigate(onSkip)}>{replaying ? 'Return to exploring' : 'Skip intro'} <span aria-hidden="true">▸</span></button>
    </section></div>}
    {preparing && <span className={styles.preparing} role="status">Preparing scene…</span>}
    <div className={styles.shutter} aria-hidden="true"/>
  </section>
}

'use client'

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { availableControls, adjustControl, controlLabel, focusControl, neighbor } from '@/lib/off-the-clock/ui-navigation'
export type MoveVector = { x: number; y: number }
export type ControlLayer = {
  priority: number; enabled?: boolean; label: string; canConfirm?: boolean
  confirm?: () => void; back?: () => void; menu?: () => void
  move?: (vector: MoveVector, dt: number) => void
}
type Slot = { id: string; priority: number; label: string; canConfirm: boolean; canMove: boolean; canBack: boolean; get: () => ControlLayer }
type Preferences = { touch: 'auto'|'on'|'off'; direction: 'stick'|'pad'; swapped: boolean }
const defaults: Preferences = { touch: 'auto', direction: 'stick', swapped: false }
type Controls = { active: Slot | undefined; register: (slot: Slot) => () => void; preferences: Preferences; setPreferences: (value: Partial<Preferences>) => void; touchEnabled: boolean }
const Context = createContext<Controls | null>(null)
export function GameControlsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [preferences, setPreferencesState] = useState(defaults)
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && (innerWidth <= 900 || matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 0))
  useEffect(() => {
    const query = matchMedia('(any-pointer: coarse)')
    let touched = false
    const update = () => setCoarse(innerWidth <= 900 || query.matches || navigator.maxTouchPoints > 0 || touched)
    const touch = (event: PointerEvent) => { if(event.pointerType==='touch' && (event.target as Element)?.closest('[data-retro-game]')) { touched=true; update() } }
    const id = requestAnimationFrame(() => {
      update()
      try {
        const saved = JSON.parse(localStorage.getItem('off-clock-controller') || '{}')
        setPreferencesState({ touch: ['auto','on','off'].includes(saved.touch) ? saved.touch : 'auto', direction: saved.direction === 'pad' ? 'pad' : 'stick', swapped: saved.swapped === true })
      } catch {}
    })
    query.addEventListener('change', update); window.addEventListener('resize',update); window.addEventListener('pointerdown',touch)
    return () => { cancelAnimationFrame(id); query.removeEventListener('change', update); window.removeEventListener('resize',update); window.removeEventListener('pointerdown',touch) }
  }, [])
  const setPreferences = useCallback((value: Partial<Preferences>) => {
    setPreferencesState(previous => { const next = { ...previous, ...value }; try { localStorage.setItem('off-clock-controller', JSON.stringify({ ...next, version: 2 })) } catch {} return next })
  }, [])
  const register = useCallback((slot: Slot) => {
    setSlots(previous => [...previous.filter(s => s.id !== slot.id), slot])
    return () => setSlots(previous => previous.filter(s => s.id !== slot.id))
  }, [])
  const active = useMemo(() => [...slots].sort((a,b) => b.priority - a.priority)[0], [slots])
  const touchEnabled = coarse || preferences.touch === 'on'
  const value = useMemo(() => ({ active, register, preferences, setPreferences, touchEnabled }), [active, register, preferences, setPreferences, touchEnabled])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useGameControls() {
  const value = useContext(Context)
  if (!value) throw Error('Game controls require a provider')
  return value
}
export function useControlLayer(layer: ControlLayer) {
  const { register } = useGameControls()
  const id = useId(), current = useRef(layer)
  useLayoutEffect(() => { current.current = layer })
  const { enabled = true, priority, label, canConfirm = !!layer.confirm } = layer
  const canMove = !!layer.move, canBack = !!layer.back
  useEffect(() => {
    if (!enabled) return
    return register({ id, priority, label, canConfirm, canMove, canBack, get: () => current.current })
  }, [register, id, enabled, priority, label, canConfirm, canMove, canBack])
  return id
}

/** A screen owns navigation, including links, settings and visible native inputs. */
export function useSurfaceControls(root: RefObject<HTMLElement | null>, enabled: boolean, priority: number, back: () => void, menu?: () => void) {
  const { active } = useGameControls()
  const held = useRef({ direction: '', next: 0 })
  const [selection, setSelection] = useState('Choose')
  const focus = (element?: HTMLElement) => { if(element && root.current) { focusControl(element,root.current); setSelection(controlLabel(element)) } }
  const ensure = () => {
    const items=availableControls(root.current)
    const selected=items.find(item=>item===document.activeElement) || items.find(item=>item.hasAttribute('data-game-focus')) || items.find(item=>item.hasAttribute('data-autofocus')) || items[0]
    focus(selected);return selected
  }
  const confirm = () => {
    const element=ensure(); if(!element)return
    if(element instanceof HTMLSelectElement)adjustControl(element,1)
    else if(!(element instanceof HTMLInputElement && element.type==='range'))element.click()
  }
  const move = (v:MoveVector) => {
    if(Math.hypot(v.x,v.y)<.25){held.current={direction:'',next:0};return}
    const ax=Math.abs(v.x),ay=Math.abs(v.y)
    const horizontal=held.current.direction ? held.current.direction.startsWith('0,') ? ax>ay*1.25 : ay<=ax*1.25 : ax>ay
    const x=horizontal?Math.sign(v.x):0,y=horizontal?0:Math.sign(v.y)
    const d=`${x},${y}`,now=performance.now()
    if(held.current.direction===d && now<held.current.next)return
    held.current={direction:d,next:now+(held.current.direction===d?130:320)}
    const current=ensure();if(!current)return
    if(x && adjustControl(current,x))return
    focus(neighbor(availableControls(root.current),current,x,y))
  }
  const id=useControlLayer({enabled,priority,label:selection,back,menu:menu||back,confirm,move})
  const owns=enabled&&active?.id===id
  const actions=useRef({ensure,confirm,move,back})
  useLayoutEffect(()=>{actions.current={ensure,confirm,move,back}})
  useEffect(()=>{
    const element=root.current;if(!owns||!element)return
    held.current={direction:'',next:0}
    const frame=requestAnimationFrame(()=>actions.current.ensure())
    const onFocus=(event:FocusEvent)=>{const target=event.target as HTMLElement;if(availableControls(element).includes(target)){element.querySelectorAll('[data-game-focus]').forEach(node=>{if(node!==target)node.removeAttribute('data-game-focus')});target.setAttribute('data-game-focus','');setSelection(controlLabel(target))}}
    const observer=new MutationObserver(records=>{if(records.some(record=>record.attributeName==='data-ui-screen')){const items=availableControls(element);const target=items.find(item=>item.hasAttribute('data-autofocus'))||items[0];if(target)focusControl(target,element)}else if(!availableControls(element).includes(document.activeElement as HTMLElement))actions.current.ensure();else setSelection(controlLabel(document.activeElement as HTMLElement))})
    observer.observe(element,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled','inert','data-ui-screen']})
    element.addEventListener('focusin',onFocus)
    const key=(event:KeyboardEvent)=>{
      const inScreen=element.contains(event.target as Node)
      const inController=(event.target as Element)?.closest('[data-touch-controller]')
      if(!inScreen&&!(inController&&event.key.startsWith('Arrow')))return
      const target=event.target as HTMLInputElement
      if(target.tagName==='TEXTAREA'||target.isContentEditable||target.tagName==='INPUT'&&!['range','checkbox','radio'].includes(target.type))return
      if(event.key==='Tab')return
      const vectors:Record<string,MoveVector>={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}}
      if(vectors[event.key]||['Enter',' ','Escape'].includes(event.key)){
        event.preventDefault();event.stopImmediatePropagation()
        if(vectors[event.key])actions.current.move(vectors[event.key])
        else if(!event.repeat){if(event.key==='Escape')actions.current.back();else actions.current.confirm()}
      }
    }
    const release=()=>{held.current={direction:'',next:0}}
    document.addEventListener('keydown',key,true);document.addEventListener('keyup',release,true)
    return()=>{cancelAnimationFrame(frame);observer.disconnect();element.removeEventListener('focusin',onFocus);document.removeEventListener('keydown',key,true);document.removeEventListener('keyup',release,true)}
  },[owns,root])
}
export function ControllerSettings() {
  const { preferences, setPreferences } = useGameControls()
  return <div data-controller-settings>
    <label>Desktop controls <select aria-label="Desktop controls" value={preferences.touch} onChange={e => setPreferences({ touch: e.target.value as Preferences['touch'] })}><option value="auto">Auto</option><option value="on">Always</option><option value="off">Hide</option></select></label>
    <label>Movement control <select aria-label="Movement control" value={preferences.direction} onChange={e => setPreferences({ direction: e.target.value as Preferences['direction'] })}><option value="stick">Joystick</option><option value="pad">Directional pad</option></select></label>
    <button aria-pressed={preferences.swapped} onClick={() => setPreferences({ swapped: !preferences.swapped })}>Swap controller sides <span>{preferences.swapped ? 'On' : 'Off'}</span></button>
  </div>
}

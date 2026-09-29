import type { Scene } from './world'

export type SoundCue = 'door' | 'open' | 'step' | 'text' | 'confirm'
export type SoundLevels = { music: number; effects: number }
export const defaultLevels: SoundLevels = { music: 25, effects: 30 }
export function sanitizeLevels(value: unknown): SoundLevels {
  const v = value && typeof value === 'object' ? value as Partial<SoundLevels> : {}
  const level = (n: unknown, fallback: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0,Math.min(100,n)) : fallback
  return { music: level(v.music,25), effects: level(v.effects,30) }
}

/** Original procedural score and effects. No samples or third-party recordings. */
export class IslandSound {
  private context = new AudioContext()
  private music = this.context.createGain()
  private effects = this.context.createGain()
  private timer: ReturnType<typeof setInterval> | undefined
  private enabled = false
  private blocked = false
  private scene: Scene = 'island'
  private step = 0
  private next = 0
  private lastFoot = 0
  private lastText = 0
  private textNote = 0
  private levels = defaultLevels
  constructor() {
    this.music.gain.value = 0; this.effects.gain.value = 0
    this.music.connect(this.context.destination); this.effects.connect(this.context.destination)
  }
  async enable() { await this.context.resume(); if (this.context.state !== 'running') throw Error('Sound could not start.'); this.enabled = true; this.update() }
  mute() { this.enabled = false; this.update(); void this.context.suspend().catch(()=>{}) }
  configure(scene: Scene, levels: SoundLevels, blocked: boolean) { this.scene = scene; this.levels = levels; this.blocked = blocked; this.update() }
  private tone(frequency: number, time: number, duration: number, volume: number, bus: GainNode, type: OscillatorType = 'sine') {
    const oscillator = this.context.createOscillator(), gain = this.context.createGain()
    oscillator.type = type; oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0,time); gain.gain.linearRampToValueAtTime(volume,time+.015)
    gain.gain.exponentialRampToValueAtTime(.0001,time+duration)
    oscillator.connect(gain); gain.connect(bus); oscillator.start(time); oscillator.stop(time+duration+.02)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
  }
  private update() {
    if (this.context.state === 'closed') return
    const now = this.context.currentTime
    this.music.gain.cancelScheduledValues(now); this.effects.gain.cancelScheduledValues(now)
    this.music.gain.setTargetAtTime(this.enabled && !this.blocked ? this.levels.music/100 : 0,now,.07)
    this.effects.gain.setTargetAtTime(this.enabled && !this.blocked ? this.levels.effects/100 : 0,now,.02)
    if (this.enabled && !this.blocked && this.levels.music > 0 && !this.timer) {
      this.next = now+.05
      this.timer = setInterval(()=>this.schedule(),100); this.schedule()
    } else if ((!this.enabled || this.blocked || this.levels.music === 0) && this.timer) { clearInterval(this.timer); this.timer = undefined }
  }
  private schedule() {
    if (this.context.state !== 'running') return
    // A slow, original pentatonic phrase; room voicings change without new assets.
    const notes = [0,7,12,4,9,7,4,2,0,4,7,14,12,9,7,4]
    const roots = { island: 130.81, music: 146.83, film: 110, games: 164.81, homelab: 98 }
    while (this.next < this.context.currentTime+.2) {
      const n = this.step++ % notes.length, root = roots[this.scene]
      this.tone(root * 2 ** (notes[n]/12),this.next,1.5,.09,this.music,this.scene==='games'?'triangle':'sine')
      if (n%4===0) this.tone(root/2,this.next,2.8,.06,this.music)
      this.next += .72
    }
  }
  cue(kind: SoundCue) {
    if (!this.enabled || this.blocked || this.context.state !== 'running') return
    const now = this.context.currentTime
    if (kind === 'text') {
      if (now - this.lastText < .085) return
      this.lastText = now
      this.tone([280,310,295][this.textNote++ % 3], now, .027, .025, this.effects, 'triangle')
      return
    }
    if (kind === 'confirm') { this.tone(390,now,.075,.045,this.effects,'triangle'); return }
    if (kind === 'step') { if (now-this.lastFoot<.32) return; this.lastFoot=now; this.tone(90,now,.06,.035,this.effects,'triangle') }
    else { this.tone(kind==='door'?180:440,now,.12,.08,this.effects,'triangle'); this.tone(kind==='door'?120:660,now+.08,.15,.04,this.effects) }
  }
  destroy() { if(this.timer) clearInterval(this.timer); this.enabled=false; void this.context.close().catch(()=>{}) }
}

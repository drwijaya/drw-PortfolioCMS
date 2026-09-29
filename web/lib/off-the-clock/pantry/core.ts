import RAPIER from '@dimforge/rapier2d-compat'
import { BOARD, FOODS, LIMITS, type Drop, type GameState } from './config'

let initialized: Promise<void> | undefined
export function initPhysics() { return initialized ??= RAPIER.init().catch(error => { initialized = undefined; throw error }) }
type Piece = { id: number; tier: number; body: RAPIER.RigidBody; born: number; entered: boolean; over: number }
const SCALE = 100

/** The same fixed-step simulation is used by the browser and the score verifier. */
export class PantrySimulation {
  private world = new RAPIER.World({ x: 0, y: 9.81 })
  private pieces: Piece[] = []
  private sequence = 0
  private rng: number
  private lastDrop = -LIMITS.cooldown
  private blockedSpawn = 0
  tick = 0
  score = 0
  merges = 0
  highest = 0
  drops = 0
  current: number
  next: number
  ended: GameState['ended'] = null
  readonly inputs: Drop[] = []

  constructor(seed: number) {
    this.rng = seed >>> 0 || 1
    this.current = this.pick(); this.next = this.pick()
    this.world.timestep = 1 / 60
    this.world.numSolverIterations = 8
    const wall = (x: number, y: number, w: number, h: number) => this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(w / SCALE, h / SCALE).setTranslation(x / SCALE, y / SCALE).setFriction(.6))
    wall(-5, 220, 5, 700); wall(325, 220, 5, 700); wall(160, 445, 170, 5)
  }
  private pick() {
    let x = this.rng; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.rng = x >>> 0
    const n = this.rng % 100
    return n < 45 ? 0 : n < 75 ? 1 : n < 93 ? 2 : 3
  }
  private add(tier: number, x: number, y: number, vx = 0, vy = 0) {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x / SCALE, y / SCALE).setLinvel(vx, vy).setLinearDamping(.15).setAngularDamping(.3).setCcdEnabled(true))
    this.world.createCollider(RAPIER.ColliderDesc.ball(FOODS[tier].radius / SCALE).setFriction(.55).setRestitution(.12).setDensity(1), body)
    this.pieces.push({ id: ++this.sequence, tier, body, born: this.tick, entered: y - FOODS[tier].radius >= BOARD.line, over: 0 })
    this.highest = Math.max(this.highest, tier)
  }
  private spawnClear(x: number) {
    const r = FOODS[this.current].radius, y = r + 3
    return !this.pieces.some(p => {
      const v = p.body.translation(), dx = v.x * SCALE - x, dy = v.y * SCALE - y
      const distance = FOODS[p.tier].radius + r + 1
      return dx * dx + dy * dy < distance * distance
    })
  }
  canDrop(x: number) {
    const r = FOODS[this.current].radius
    return !this.ended && this.tick - this.lastDrop >= LIMITS.cooldown && Number.isInteger(x) && x >= r && x <= BOARD.width - r && this.spawnClear(x)
  }
  drop(x: number) {
    if (!this.canDrop(x)) return false
    this.inputs.push({ tick: this.tick, x }); this.lastDrop = this.tick
    this.add(this.current, x, FOODS[this.current].radius + 3)
    this.current = this.next; this.next = this.pick(); this.drops++
    return true
  }
  step() {
    if (this.ended) return
    this.world.step(); this.tick++
    const used = new Set<number>()
    const merged: {tier:number;x:number;y:number;vx:number;vy:number}[] = []
    // The stable ID order is part of the rules. Each body is consumed once per tick.
    for (let i = 0; i < this.pieces.length; i++) {
      const a = this.pieces[i]
      if (used.has(a.id)) continue
      for (let j = i + 1; j < this.pieces.length; j++) {
        const b = this.pieces[j]
        if (used.has(b.id) || a.tier !== b.tier) continue
        const ap = a.body.translation(), bp = b.body.translation()
        const dx = (ap.x - bp.x) * SCALE, dy = (ap.y - bp.y) * SCALE
        const diameter = FOODS[a.tier].radius * 2 + .8
        if (dx * dx + dy * dy > diameter * diameter) continue
        used.add(a.id); used.add(b.id); this.merges++
        if (a.tier === FOODS.length - 1) this.score += 5120
        else {
          const tier = a.tier + 1, radius = FOODS[tier].radius
          const av = a.body.linvel(), bv = b.body.linvel()
          merged.push({ tier, x: Math.max(radius, Math.min(BOARD.width - radius, (ap.x + bp.x) * SCALE / 2)),
            y: Math.min(BOARD.height - radius, (ap.y + bp.y) * SCALE / 2),
            vx: Math.max(-2, Math.min(2, (av.x + bv.x) / 2)), vy: Math.max(-2, Math.min(2, (av.y + bv.y) / 2)) })
          this.score += FOODS[tier].points
        }
        break
      }
    }
    for (const p of this.pieces) if (used.has(p.id)) this.world.removeRigidBody(p.body)
    this.pieces = this.pieces.filter(p => !used.has(p.id))
    for (const p of merged) this.add(p.tier, p.x, p.y, p.vx, p.vy)
    for (const p of this.pieces) {
      const top = p.body.translation().y * SCALE - FOODS[p.tier].radius
      if (top >= BOARD.line) p.entered = true
      if (top < BOARD.line && (p.entered || this.tick - p.born >= 90)) p.over++
      else p.over = 0
      if (p.over >= 120) this.ended = 'overflow'
    }
    const r = FOODS[this.current].radius
    const anySpawn = Array.from({length: 17}, (_, i) => Math.round(r + (BOARD.width - 2 * r) * i / 16)).some(x => this.spawnClear(x))
    this.blockedSpawn = anySpawn ? 0 : this.blockedSpawn + 1
    if (this.blockedSpawn >= 180) this.ended = 'overflow'
    if (this.tick >= LIMITS.ticks || this.drops >= LIMITS.drops || this.pieces.length >= LIMITS.bodies) this.ended = 'limit'
  }
  finish() { this.ended ??= 'finished' }
  state(): GameState {
    return { tick: this.tick, score: this.score, merges: this.merges, highest: this.highest, drops: this.drops,
      current: this.current, next: this.next, ready: !this.ended && this.tick - this.lastDrop >= LIMITS.cooldown,
      warning: this.pieces.reduce((n, p) => Math.max(n, p.over / 120), this.blockedSpawn / 180), ended: this.ended,
      foods: this.pieces.map(p => ({ id: p.id, tier: p.tier, x: p.body.translation().x * SCALE, y: p.body.translation().y * SCALE, angle: p.body.rotation() })) }
  }
  destroy() { this.world.free(); this.pieces = [] }
}

export function validateReplay(value: unknown): { events: Drop[]; endTick: number } {
  if (!value || typeof value !== 'object') throw Error('Invalid replay.')
  const v = value as { events?: unknown; endTick?: unknown }
  if (!Number.isInteger(v.endTick) || (v.endTick as number) < 1 || (v.endTick as number) > LIMITS.ticks || !Array.isArray(v.events) || v.events.length > LIMITS.drops) throw Error('Invalid replay limits.')
  let previous = -LIMITS.cooldown
  const events = v.events.map((event: unknown) => {
    if (!event || typeof event !== 'object') throw Error('Invalid drop.')
    const e = event as Drop
    if (!Number.isInteger(e.tick) || e.tick < 0 || e.tick >= (v.endTick as number) || e.tick - previous < LIMITS.cooldown || !Number.isInteger(e.x) || e.x < 0 || e.x > BOARD.width) throw Error('Invalid drop order or position.')
    previous = e.tick; return { tick: e.tick, x: e.x }
  })
  return { events, endTick: v.endTick as number }
}
export function replay(seed: number, events: Drop[], endTick: number) {
  const sim = new PantrySimulation(seed)
  try {
    let index = 0
    while (sim.tick < endTick) {
      if (sim.ended) throw Error('Replay continues after the run ended.')
      if (events[index]?.tick === sim.tick) { if (!sim.drop(events[index].x)) throw Error('Illegal drop.'); index++ }
      sim.step()
    }
    if (index !== events.length) throw Error('Unplayed input.')
    sim.finish()
    return sim.state()
  } finally { sim.destroy() }
}

import { rooms, type RoomId } from '../../content/off-the-clock'
import buildingSprites from './building-sprites.json'

export type Scene = 'island' | RoomId
export type Point = { x: number; y: number }
export type Rect = Point & { w: number; h: number }
export type Hotspot = Rect & { id: string; label: string; room?: RoomId; item?: number }
export const WIDTH = 480
export const HEIGHT = 340
export const SPAWN: Point = { x: 240, y: 294 }

export const buildings: (Rect & { id: RoomId; sign: string })[] = [
  { id: 'homelab', sign: 'HOMELAB', x: 92, y: 66, w: 88, h: 67 },
  { id: 'music', sign: 'MUSIC', x: 300, y: 66, w: 88, h: 67 },
  { id: 'film', sign: 'FILM', x: 92, y: 194, w: 88, h: 67 },
  { id: 'games', sign: 'GAMES', x: 300, y: 194, w: 88, h: 67 },
]

export type Building = (typeof buildings)[number]

/** Door anchors are shared by art, walking, threshold crossing and room return. */
export function buildingGeometry(b: Building) {
  const sprite = buildingSprites[b.id]
  const visual = { x:b.x+sprite.offsetX, y:b.y+sprite.offsetY, w:sprite.width, h:sprite.height }
  const door = { x:visual.x+sprite.door.x, y:visual.y+sprite.door.y, w:sprite.door.w, h:sprite.door.h }
  const center = door.x+door.w/2, threshold = door.y+door.h
  return { visual, door,
    entry: { x:center, y:threshold },
    approach: { x:center, y:threshold+13 },
    returnPoint: { x:center, y:threshold+15 },
    trigger: { x:center-8, y:threshold+3, w:16, h:6 },
    hotspot: { x:center-11, y:threshold-8, w:22, h:17 },
    footprint: { x:visual.x+3, y:visual.y, w:visual.w-6, h:threshold-visual.y-1 },
  }
}

export const trees: Point[] = [
  { x: 82, y: 59 }, { x: 112, y: 45 }, { x: 160, y: 41 },
  { x: 310, y: 42 }, { x: 365, y: 45 }, { x: 405, y: 88 },
  { x: 62, y: 123 }, { x: 71, y: 174 }, { x: 414, y: 159 },
  { x: 57, y: 218 }, { x: 409, y: 190 },
]

export const land: Rect[] = [
  { x: 104, y: 35, w: 272, h: 264 },
  { x: 72, y: 51, w: 328, h: 232 },
  { x: 48, y: 93, w: 376, h: 157 },
  { x: 64, y: 77, w: 348, h: 190 },
  { x: 222, y: 279, w: 36, h: 49 },
]

export function contains(p: Point, r: Rect, pad = 0): boolean {
  return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad
}

// Footprints are shared by rendering and collision so every furnishing is a real
// object. Its sprite rises above this floor rectangle and is depth-sorted.
export type Furniture = Rect & { kind: 'bins' | 'shelf' | 'turntable' | 'bench' | 'sofa' | 'screen' | 'booth' | 'popcorn' | 'cabinet' | 'claw' | 'prizes' | 'cocktail' | 'stool' | 'plant' | 'journal' | 'rack' | 'desk' | 'tools'; rise: number }
const f = (kind: Furniture['kind'], x: number, y: number, w: number, h: number, rise: number): Furniture => ({kind,x,y,w,h,rise})
export const furnishings: Record<RoomId, Furniture[]> = {
  music: [f('bins',100,149,294,20,28), f('turntable',350,222,66,21,28),
    f('sofa',193,236,94,26,27), f('journal',388,288,43,15,14)],
  film: [f('shelf',108,165,282,19,28), f('booth',42,181,42,20,50),
    f('sofa',193,236,94,26,27), f('bench',292,233,27,20,16),
    f('journal',349,279,41,15,16)],
  games: [f('cabinet',44,172,60,24,101), f('cabinet',119,172,60,24,101),
    f('cabinet',301,172,60,24,101), f('cabinet',376,172,60,24,101),
    f('claw',194,165,42,23,60), f('prizes',246,165,43,23,36),
    f('cocktail',207,239,72,26,27), f('stool',186,255,16,12,12), f('stool',285,255,16,12,12),
    f('stool',64,212,16,12,12), f('stool',397,212,16,12,12),
    f('journal',383,289,44,15,15)],
  homelab: [f('rack',64,147,57,24,78), f('desk',158,150,70,24,51), f('tools',258,148,65,23,65), f('desk',360,151,62,23,36),
    f('bench',210,226,65,22,23)],
}
export function displayX(scene: Scene, i: number) { return scene === 'games' ? [53,128,310,385][i] : 112 + i * 76 }
export function hotspots(scene: Scene): Hotspot[] {
  if (scene === 'island') return buildings.map(b => ({
    ...buildingGeometry(b).hotspot,
    id: b.id, label: `Enter ${b.sign.charAt(0)}${b.sign.slice(1).toLowerCase()}`, room: b.id,
  }))
  const names = scene === 'homelab'
    ? ['Server rack', 'Desk terminal', 'Network board', 'Workshop notes']
    : rooms[scene].favorites.map(item => `Inspect ${item.title}`)
  const items: Hotspot[] = names.map((label, i) => ({
    x: scene === 'homelab' ? 64 + i * 100 : displayX(scene, i),
    y: scene === 'games' ? 180 : scene === 'film' ? 180 : 157, w: scene === 'homelab' ? 60 : 48, h: 16,
    id: `item-${i}`, label, item: i,
  }))
  if (scene === 'music') {
    const turntable = furnishings.music.find(o => o.kind === 'turntable')!
    items.push({ ...turntable, id: 'listen', label: 'Play a record' })
  }
  if (scene === 'games') {
    const cabinet = furnishings.games.find(o => o.kind === 'cocktail')!
    items.push({ ...cabinet, id: 'pantry', label: 'Play Pantry Drop' })
  }
  if(scene==='film')items.push({...furnishings.film.find(o=>o.kind==='booth')!,id:'booth',label:'Make a photo strip'})
  const journal = furnishings[scene].find(o => o.kind === 'journal')
  if (journal) items.push({ ...journal, id: 'journal', label: `Read the ${scene} journal` })
  items.push({ x: 224, y: 298, w: 32, h: 17, id: 'exit', label: 'Back to the island' })
  return items
}

export function solids(scene: Scene): Rect[] {
  if (scene === 'island') return [
    ...buildings.map(b => buildingGeometry(b).footprint),
    ...trees.map(t => ({ x: t.x - 4, y: t.y - 5, w: 8, h: 8 })),
    { x: 215, y: 153, w: 12, h: 9 },
    { x: 265, y: 163, w: 26, h: 8 },
  ]
  return furnishings[scene]
}

export function canStand(scene: Scene, p: Point): boolean {
  const ground = scene === 'island' ? land : [{ x: 34, y: 174, w: 412, h: 140 }]
  // Test all four corners of the feet, including at jagged shoreline corners.
  const corners = [{ x: p.x - 4, y: p.y - 2 }, { x: p.x + 4, y: p.y - 2 },
    { x: p.x - 4, y: p.y + 2 }, { x: p.x + 4, y: p.y + 2 }]
  return corners.every(c => ground.some(r => contains(c, r))) && !solids(scene).some(r => contains(p, r, 4))
}

export function movePlayer(scene: Scene, p: Point, dx: number, dy: number): Point {
  // Substeps keep long frames from crossing furniture or the shoreline.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3))
  const next = { ...p }
  for (let i = 0; i < steps; i++) {
    if (canStand(scene, { x: next.x + dx / steps, y: next.y })) next.x += dx / steps
    if (canStand(scene, { x: next.x, y: next.y + dy / steps })) next.y += dy / steps
  }
  return next
}

export function nearest(scene: Scene, p: Point): Hotspot | undefined {
  return hotspots(scene).filter(h => contains(p, h, 17)).sort((a, b) =>
    Math.hypot(p.x - a.x - a.w / 2, p.y - a.y - a.h / 2) - Math.hypot(p.x - b.x - b.w / 2, p.y - b.y - b.h / 2)
  )[0]
}

/** A collision-aware walking route, ending where the selected object is in reach. */
export function pathToHotspot(scene: Scene, start: Point, target: Hotspot): Point[] | undefined {
  const building = target.room ? buildings.find(b=>b.id===target.room) : undefined
  const door = building ? buildingGeometry(building).approach : target.id === 'exit' ? { x: 240, y: 298 } : null
  return findPath(scene, start, p => door ? Math.hypot(p.x-door.x,p.y-door.y) <= 3 : contains(p, target, 12) && nearest(scene, p)?.id === target.id)
}

/** Ground taps snap only a short distance to a safe, reachable floor tile. */
export function pathToPoint(scene: Scene, start: Point, destination: Point): Point[] | undefined {
  if (!Number.isFinite(destination.x) || !Number.isFinite(destination.y)) return undefined
  return findPath(scene, start, p => canStand(scene,p) && Math.hypot(p.x-destination.x,p.y-destination.y) <= 5)
}

function findPath(scene: Scene, start: Point, reached: (p: Point) => boolean): Point[] | undefined {
  if (reached(start)) return []
  const step = 4
  const nodes: { p: Point; parent: number }[] = [{ p: start, parent: -1 }]
  const seen = new Set(['0,0'])
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    for (const [dx, dy] of [[step,0],[-step,0],[0,step],[0,-step],[step,step],[-step,step],[step,-step],[-step,-step]]) {
      const p = { x: node.p.x + dx, y: node.p.y + dy }
      const key = `${Math.round((p.x-start.x)/step)},${Math.round((p.y-start.y)/step)}`
      if (seen.has(key)) continue
      seen.add(key)
      if (!canStand(scene,p)) continue
      const moved = movePlayer(scene,node.p,dx,dy)
      if (Math.hypot(moved.x-p.x,moved.y-p.y)>.01) continue
      const next = nodes.push({p,parent:index})-1
      if (reached(p)) {
        const path: Point[]=[]
        for(let i=next;nodes[i].parent!==-1;i=nodes[i].parent) path.push(nodes[i].p)
        return path.reverse()
      }
    }
  }
  return undefined
}

import type { RoomId } from '../../content/off-the-clock'
import definitions from './building-sprites.json'
import { buildingGeometry, type Building } from './world'
import type { Palette } from './palette'

const images = new Map<RoomId, HTMLImageElement>()
let loading: Promise<void> | undefined

function decode(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{
    const image = new Image()
    const timeout = setTimeout(()=>reject(new Error('Building artwork timed out')),45000)
    image.onload = () => { clearTimeout(timeout); image.decode().then(()=>resolve(image),reject) }
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Building artwork unavailable')) }
    image.src = src
  })
}

/** Never reveal the island with a partial set. Failed loads can be retried. */
export function preloadBuildingSprites(): Promise<void> {
  if (!loading) loading = Promise.allSettled((Object.keys(definitions) as RoomId[]).map(async id=>{
    if (images.has(id)) return
    images.set(id,await decode(`/img/off-the-clock/buildings/${definitions[id].file}`))
  })).then(results=>{
    if (results.some(result=>result.status==='rejected')) throw new Error('Building artwork unavailable')
  }).catch(error=>{loading=undefined;throw error})
  return loading
}

export function hasBuildingSprite(id: RoomId) { return images.has(id) }
export function loadedBuildingSprites() { return [...images.keys()].sort().join(',') }

/** All compositing happens on the same integer grid as the cat and island. */
export function drawBuildingSprite(ctx: CanvasRenderingContext2D, b: Building, c: Palette, open: number, active: boolean, character?: () => void) {
  const image = images.get(b.id)
  if (!image) return false
  const sprite = definitions[b.id], {visual,door,entry} = buildingGeometry(b)
  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  const crop=sprite.crop
  ctx.drawImage(image,crop.x,crop.y,crop.w,crop.h,visual.x,visual.y,visual.w,visual.h)
  const source = sprite.sourceDoor
  if (open > 0) {
    const step = Math.min(3,Math.ceil(open*3))
    ctx.fillStyle = '#2e2a26'
    ctx.fillRect(door.x,door.y,door.w,door.h)
    if(sprite.style === 'open') {
      // Retain the arcade's checkerboard corridor under the moving cat.
      ctx.drawImage(image,source.x,source.y,source.w,source.h,door.x,door.y,door.w,door.h)
      ctx.fillStyle=c.sand;ctx.fillRect(door.x+2,door.y+1,door.w-4,1)
    }
    if(character) {
      ctx.save();ctx.beginPath()
      ctx.rect(door.x,door.y,door.w,door.h)
      ctx.rect(door.x-12,entry.y,door.w+24,30)
      ctx.clip();character();ctx.restore()
    }
    if(sprite.style !== 'open') {
      const double = sprite.style === 'double'
      const sourceWidth = double ? source.w/2 : source.w
      const leafWidth = Math.max(1,Math.round((double ? door.w/2 : door.w)*(1-step/3)))
      ctx.drawImage(image,source.x,source.y,sourceWidth,source.h,door.x,door.y,leafWidth,door.h)
      if(double)ctx.drawImage(image,source.x+sourceWidth,source.y,sourceWidth,source.h,door.x+door.w-leafWidth,door.y,leafWidth,door.h)
    }
  }
  if(active) { ctx.fillStyle=c.accent;ctx.fillRect(door.x,entry.y+4,door.w,1) }
  ctx.restore()
  return true
}

import { buildings } from './world'
import type { Palette } from './palette'

export function createPixelScene(ctx: CanvasRenderingContext2D, c: Palette, ambientTick = 0, active?: string, effects?: { doorId?: string; doorOpen: number }) {
  const r = (x: number, y: number, w: number, h: number, color = c.ink) => {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }
  const line = (x: number, y: number, w: number, color = c.ink) => r(x, y, w, 1, color)
  // Text is an HTML overlay, never enlarged from low-resolution canvas pixels.
  const disc = (x: number, y: number, radius: number, color = c.ink) => {
    for (let row = -radius; row <= radius; row++) {
      const half = Math.floor(Math.sqrt(radius * radius - row * row))
      r(x - half, y + row, half * 2 + 1, 1, color)
    }
  }
  const lamp = (x: number, y: number) => {
    r(x - 1, y - 8, 2, 9); r(x - 5, y, 10, 3); r(x - 4, y + 3, 8, 6, c.accent)
    r(x - 2, y + 4, 4, 3, c.paper)
  }
  const frame = (x: number, y: number, w: number, h: number, fill = c.paper) => {
    r(x, y, w, h); r(x + 2, y + 2, w - 4, h - 4, fill)
  }
  const plant = (x: number, y: number) => {
    r(x - 5, y - 8, 11, 11); r(x - 3, y - 6, 7, 8, c.accent); r(x - 6, y - 9, 13, 3, c.accent)
    r(x, y - 23, 2, 15)
    for (const [dx,dy] of [[-5,-22],[5,-25],[-8,-17],[7,-16]]) {
      disc(x+dx,y+dy,4); r(x+dx-2,y+dy-2,3,2,c.accent)
      r(x+Math.min(0,dx),y+dy+3,Math.abs(dx)+2,2)
    }
  }
  const tree = (x: number, y: number) => {
    r(x - 3, y - 5, 6, 8, c.accent); r(x - 13, y - 16, 26, 6)
    r(x - 11, y - 27, 22, 16); r(x - 7, y - 34, 14, 8)
    r(x - 8, y - 28, 7, 4, c.accent); r(x - 10, y - 21, 7, 3, c.accent)
    r(x + 3, y - 18, 6, 3, c.sand); r(x - 3, y - 31, 3, 2, c.sand)
    const breeze = Math.floor(ambientTick / 650) % 8
    if (breeze === 2 || breeze === 3 || breeze === 6) {
      r(x + 7, y - 30, 2, 3, c.ink); r(x - 9, y - 23, 3, 2, c.accent)
    }
  }
  const roof = (x: number, y: number, w: number) => {
    for (let row = 0; row < 7; row++) {
      r(x + 14 - row * 2, y + row * 4, w - 28 + row * 4, 4, c.ink)
      r(x + 15 - row * 2, y + row * 4 + 1, w - 30 + row * 4, 2, c.accent)
      for (let col = 0; col < 7; col++) r(x + 17 + col * 9 - (row % 2) * 4, y + row * 4 + 2, 1, 2, c.ink)
    }
  }
  const building = (b: (typeof buildings)[number]) => {
    const { x, y, w, h, id } = b
    r(x + 5, y + h - 4, w, 7, c.sand)
    frame(x + 4, y + 23, w - 8, h - 22, c.paper)
    if (id === 'homelab') {
      // A flat-roofed machine workshop: solar tiles, ventilation, and pipes.
      frame(x + 2, y + 5, w - 4, 24, c.sand)
      frame(x + 11, y - 1, 52, 24, c.ink)
      for (let i = 0; i < 4; i++) { r(x + 14 + i * 12, y + 2, 9, 8, c.accent); r(x + 14 + i * 12, y + 12, 9, 8, c.sand) }
      frame(x + 68, y - 10, 12, 27, c.accent)
      for (let j = 0; j < 4; j++) line(x + 71, y - 6 + j * 5, 6)
      r(x + 81, y + 30, 3, 33, c.accent); r(x + 73, y + 30, 11, 3, c.accent)
      frame(x + 10, y + 34, 22, 27, c.ink)
      for (let j = 0; j < 4; j++) { line(x + 14, y + 39 + j * 5, 14, c.sand); r(x + 15, y + 38 + j * 5, 2, 2, (j + Math.floor(ambientTick / 900)) % 2 ? c.accent : c.paper) }
      frame(x + 60, y + 35, 16, 19, c.sand)
      for (let j = 0; j < 3; j++) line(x + 63, y + 39 + j * 4, 10)
    } else if (id === 'music') {
      // A record shop: pitched roof, oversized vinyl, striped canvas awning.
      roof(x, y - 3, w)
      disc(x + 44, y + 10, 16); disc(x + 44, y + 10, 12, c.accent)
      disc(x + 44, y + 10, 9); disc(x + 44, y + 10, 4, c.paper); r(x + 43, y + 9, 2, 2, c.accent)
      frame(x, y + 28, w, 12, c.paper)
      for (let j = 2; j < w - 2; j += 12) r(x + j, y + 30, 6, 9, c.accent)
      frame(x + 10, y + 43, 21, 18, c.sand); frame(x + 59, y + 43, 20, 18, c.sand)
      for (let j = 0; j < 4; j++) { r(x + 13 + j * 4, y + 46 + j % 2, 2, 11); r(x + 62 + j * 4, y + 46, 2, 11, c.accent) }
    } else if (id === 'film') {
      // An art-deco cinema: stepped crown, film reel, marquee, velvet curtains.
      r(x + 20, y - 6, 48, 12); r(x + 28, y - 12, 32, 8, c.accent)
      disc(x + 44, y - 3, 11); disc(x + 44, y - 3, 8, c.sand)
      for (const [dx, dy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) disc(x + 44 + dx, y - 3 + dy, 2)
      frame(x - 2, y + 9, w + 4, 22, c.accent); frame(x + 4, y + 14, w - 8, 11, c.paper)
      for (let j = 4; j < w; j += 8) { r(x + j, y + 11, 2, 2, c.paper); r(x + j, y + 27, 2, 2, c.paper) }
      frame(x + 9, y + 36, 16, 27, c.accent); frame(x + 63, y + 36, 16, 27, c.accent)
      r(x + 12, y + 39, 10, 21, c.sand); r(x + 66, y + 39, 10, 21, c.sand)
      r(x + 15, y + 43, 4, 10); r(x + 69, y + 46, 4, 11)
      r(x + 28, y + 36, 5, 27, c.accent); r(x + 55, y + 36, 5, 27, c.accent)
    } else {
      // A vintage arcade: stepped cabinet silhouette and a giant gamepad sign.
      frame(x, y + 8, w, 22, c.ink); r(x + 6, y + 4, w - 12, 5, c.accent)
      r(x + 11, y, w - 22, 5); r(x + 30, y + 12, 28, 12, c.paper)
      r(x + 26, y + 16, 5, 11, c.paper); r(x + 57, y + 16, 5, 11, c.paper)
      r(x + 33, y + 14, 3, 9); r(x + 30, y + 17, 9, 3)
      r(x + 49, y + 15, 3, 3, c.accent); r(x + 53, y + 19, 3, 3, c.accent)
      for (const dx of [10, 61]) {
        frame(x + dx, y + 35, 18, 28, c.accent); frame(x + dx + 3, y + 39, 12, 12, c.ink)
        r(x + dx + 7, y + 43, 4, 4, c.sand); r(x + dx + 3, y + 53, 12, 3, c.paper)
        r(x + dx + 6, y + 52, 2, 4); r(x + dx + 12, y + 54, 2, 2)
      }
      for (let j = 5; j < w - 5; j += 5) r(x + j, y + 31, 2, 2, c.accent)
    }
    r(x + 35, y + 42, 18, 24); r(x + 37, y + 44, 14, 20, c.accent)
    if (effects?.doorId === id && effects.doorOpen > 0) {
      r(x+37,y+44,14,20,c.ink); r(x+37,y+44,Math.max(2,Math.round(14*(1-effects.doorOpen))),20,c.accent)
    } else r(x + 47, y + 55, 2, 2, c.paper); r(x + 31, y + 66, 26, 3, c.accent)
    if (active === id) r(x + 33, y + 68, 22, 2, c.ink)
  }

  return { r, line, disc, lamp, frame, plant, tree, building }
}

/** Pattern changes suggest water without translating the sea itself. */
export function drawSea(ctx: CanvasRenderingContext2D, c: Palette, tick: number, top: number, width: number, height: number) {
  const { r, line } = createPixelScene(ctx, c)
  r(0, top, width, height - top, c.paper)
  for (let row = 0; row < Math.ceil((height-top)/19); row++) {
    for (let col = 0; col < Math.ceil(width/43); col++) {
      const phase = (Math.floor(tick/380) + row*3 + col*7) % 8
      const x = col*43 + (row%2)*17 + (col*11%13), y = top+row*19+7
      const length = [8,10,13,15,13,10,7,5][phase]
      line(x,y,length,c.sand)
      if (phase > 1 && phase < 6) line(x+length,y-1,3,c.sand)
      if ((row+col)%5===0 && phase>3) line(x+4,y+2,5,c.accent)
    }
  }
}

export function boatBob(tick: number) { return [0, 1, 0, -1][Math.floor(tick/700)%4] }

/** Centered on its ground point; every boat part shares the same bob. */
export function drawBoat(ctx: CanvasRenderingContext2D, c: Palette, x: number, y: number, tick: number, wake = false) {
  const { r, line } = createPixelScene(ctx,c)
  const bob = boatBob(tick), cy = Math.round(y)+bob
  if (wake) {
    for (let i=0;i<5;i++) {
      const step=(Math.floor(tick/260)+i*2)%10, spread=11+step*2
      line(x-spread-6,y+11+step*3,7,c.sand); line(x+spread,y+11+step*3,7,c.sand)
    }
  }
  // Broken ripples beside the hull also move when the boat is moored.
  const ripple = Math.floor(tick/550)%3
  line(x-23-ripple,cy+1,7,c.sand); line(x+19,cy+7+ripple,8,c.sand)
  for(let row=0;row<37;row++) {
    const half = row<9 ? 5+row : row>30 ? 16-Math.floor((row-30)/2) : 16
    r(x-half,cy-24+row,half*2+1,1,c.ink)
    if(row>2&&row<34) r(x-half+2,cy-24+row,half*2-3,1,c.accent)
  }
  r(x-11,cy-11,23,20,c.ink); r(x-9,cy-9,19,16,c.accent)
  for(const dy of [-7,1,8]) {r(x-11,cy+dy,23,3,c.sand);line(x-11,cy+dy+3,23,c.ink)}
  r(x-16,cy-1,3,10,c.sand); r(x+14,cy-1,3,10,c.sand)
  r(x-2,cy+10,4,7,c.ink); r(x-1,cy+10,2,5,c.accent)
}

export function drawFlag(ctx: CanvasRenderingContext2D, c: Palette, x: number, y: number, tick: number) {
  const { r }=createPixelScene(ctx,c)
  r(x,y-24,2,25,c.ink)
  const gust=[0,1,2,1,0,0,-1,0][Math.floor(tick/650)%8]
  for(let col=0;col<15;col++) {
    const dy=col<5?0:Math.round(gust*(col-4)/10)
    r(x+2+col,y-24+dy,1,9,c.ink)
    if(col<13)r(x+2+col,y-22+dy,1,5,c.paper)
    if(col>4&&col<9)r(x+2+col,y-21+dy,1,3,c.accent)
  }
}

export function drawBird(ctx: CanvasRenderingContext2D, c: Palette, x: number, y: number, tick: number) {
  const { line }=createPixelScene(ctx,c)
  const flap=[-1,0,1,0][Math.floor(tick/400)%4]
  line(x,y+flap,3,c.accent);line(x+3,y+1,2,c.accent);line(x+5,y+flap,3,c.accent)
}

export function drawCloud(ctx: CanvasRenderingContext2D, c: Palette, x: number, y: number, width: number, tick: number) {
  const { r }=createPixelScene(ctx,c)
  const drift=Math.floor(tick/1100)%12
  r(x+drift,y,width,3,c.sand);r(x+9+drift,y-4,width-19,4,c.sand)
  r(x+17+drift,y-9,Math.max(8,width-38),5,c.sand)
}

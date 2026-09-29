import { buildings, displayX, furnishings, HEIGHT, land, trees, WIDTH, type Furniture, type Point, type Scene } from './world'

import { drawCat } from './cat-sprite'
import { drawBuildingSprite, hasBuildingSprite } from './building-sprites'

import { createPixelScene, drawSea, drawBoat, drawFlag, drawBird } from './pixel-scene'
import type { Palette } from './palette'
export { light, dark, type Palette } from './palette'

// Scenery and the native tabby share exactly four palette roles.
export function drawWorld(ctx: CanvasRenderingContext2D, scene: Scene, player: Point,
  palette: Palette, tick: number, walking: boolean, facing: number, zoom: number, active?: string, effects?: { buildingArt?: boolean; ambientPaused?: boolean; ambientTick?: number; doorId?: string; doorOpen: number; marker?: { point: Point; valid: boolean } }) {
  const c = palette
  const ambientTick=effects?.ambientTick ?? (effects?.ambientPaused?0:tick)
  const { r, line, disc, lamp, frame, plant, tree, building } = createPixelScene(ctx, c, ambientTick, active, effects)
  const character = () => drawCat(ctx, player, facing, walking, walking ? tick : ambientTick, c)

  ctx.save()
  ctx.imageSmoothingEnabled = false
  r(0, 0, WIDTH, HEIGHT, c.paper)
  if (zoom > 1) {
    const vw = WIDTH / zoom, vh = HEIGHT / zoom
    const cx = Math.round(Math.max(0, Math.min(WIDTH - vw, player.x - vw / 2)))
    const cy = Math.round(Math.max(0, Math.min(HEIGHT - vh, player.y - vh / 2)))
    ctx.scale(zoom, zoom); ctx.translate(-cx, -cy)
  }
  if (scene === 'island') {
    drawSea(ctx, c, ambientTick, 0, WIDTH, HEIGHT)
    // Broken foam follows the island's exposed southern shore; each patch has
    // its own phase and the dock keeps its clear approach.
    for (let x=53;x<424;x+=24) {
      if(x>218&&x<260)continue
      const coast=land.slice(0,-1).filter(a=>x>=a.x&&x<=a.x+a.w)
      if(!coast.length)continue
      const y=Math.max(...coast.map(a=>a.y+a.h))
      const phase=(Math.floor(ambientTick/450)+Math.floor(x/24))%5
      if(phase<4)line(x+phase,y+7+Math.floor(phase/2),10-phase,c.sand)
    }
    // Stepped shoreline and a sand rim.
    for (const rect of land.slice(0, -1)) r(rect.x - 3, rect.y + 2, rect.w + 6, rect.h + 4, c.accent)
    for (const rect of land.slice(0, -1)) r(rect.x, rect.y, rect.w, rect.h, c.sand)
    for (const rect of land.slice(0, -1)) r(rect.x + 7, rect.y + 5, rect.w - 14, rect.h - 12, c.paper)
    for (let i = 0; i < 210; i++) {
      const x = 62 + (i * 71 % 348), y = 45 + (i * 43 % 236)
      if (land.slice(0, -1).some(a => x > a.x + 12 && x < a.x + a.w - 12 && y > a.y + 10 && y < a.y + a.h - 10)) {
        r(x, y, 1, 2, c.sand); r(x + 2, y - 1, 1, 2, c.sand)
      }
    }
    r(228, 77, 24, 219, c.sand); r(135, 146, 209, 20, c.sand)
    r(135, 270, 209, 14, c.sand); r(129, 128, 15, 30, c.sand); r(337, 128, 15, 30, c.sand)
    r(129, 256, 15, 22, c.sand); r(337, 256, 15, 22, c.sand)
    r(208, 145, 63, 39, c.sand)
    for (let i = 0; i < 23; i++) line(231 + i % 2 * 5, 86 + i * 9, 11, c.paper)
    // Dock, bollards, and mooring line.
    r(220, 284, 40, 45); r(222, 284, 36, 44, c.accent)
    for (let y = 287; y < 327; y += 6) line(223, y, 34, c.sand)
    for (const x of [218, 258]) for (const y of [287, 316]) { r(x, y, 4, 7); r(x, y, 4, 2, c.sand) }
    drawBoat(ctx, c, 282, 304, ambientTick)
    // The mooring line joins the same boat used in the arrival scene.
    for (let i=0;i<12;i++) r(260+i,310+Math.round(i/3),1,1,c.ink)
    drawFlag(ctx,c,397,75,ambientTick)
    // Plaza sign, bench, and flowers.
    r(219, 145, 3, 17); frame(207, 139, 28, 11, c.paper); r(216, 142, 4, 3, c.accent); r(222, 142, 4, 3, c.accent); r(218, 145, 6, 2, c.accent)
    r(265, 158, 26, 4, c.accent); r(265, 164, 26, 4, c.accent); r(267, 168, 2, 5); r(287, 168, 2, 5)
    for (const [x, y] of [[192, 77], [286, 205], [83, 266], [380, 163], [198, 228], [274, 59]]) {
      r(x, y, 1, 6, c.accent); r(x - 2, y - 1, 5, 3, c.accent); r(x, y, 1, 1, c.paper)
    }
    // Y-sorting lets the player pass behind roofs and tree canopies.
    const entering = effects?.buildingArt && effects.doorId && effects.doorOpen>0 && hasBuildingSprite(effects.doorId as (typeof buildings)[number]['id']) ? effects.doorId : undefined
    const actors = [
      ...buildings.map(b => ({ y: b.y + b.h, draw: () => {
        if(!effects?.buildingArt || !drawBuildingSprite(ctx,b,c,effects?.doorId===b.id ? effects.doorOpen : 0,active===b.id,entering===b.id ? character : undefined))building(b)
      } })),
      ...trees.map(t => ({ y: t.y, draw: () => tree(t.x, t.y) })),
      ...(!entering ? [{ y: player.y, draw: character }] : []),
    ]
    actors.sort((a, b) => a.y - b.y).forEach(a => a.draw())
    drawBird(ctx,c,31,49,ambientTick)
    drawBird(ctx,c,442,284,ambientTick+1700)
  } else {
    // A furnished cutaway, with a pale wall and textured floor. Every movable
    // furnishing below uses the same footprint as the movement system.
    r(25, 29, 430, 292, c.accent); r(18, 48, 444, 247, c.accent)
    r(29, 33, 422, 282, c.sand); r(22, 52, 436, 239, c.sand)
    r(33, 40, 414, 266, c.paper); r(27, 56, 426, 231, c.paper)
    r(32, 40, 2, 258); r(447, 40, 2, 258)
    line(34, 137, 413, c.sand); line(34, 139, 413, c.accent)
    for (let i = 0; i < 220; i++) {
      const x = 37 + i * 73 % 402, y = 49 + i * 47 % 251
      line(x, y, 2, c.sand); line(x + 2, y - 1, 2, c.sand)
    }
    // A rug anchors the central activity instead of leaving a vacant floor.
    r(167, 210, 146, 71, c.sand); r(169, 212, 142, 67, c.paper)
    for (let x = 175; x < 307; x += 6) { r(x, 216, 2, 2, c.sand); r(x, 273, 2, 2, c.sand) }
    for (let y = 222; y < 270; y += 6) { r(174, y, 2, 2, c.sand); r(306, y, 2, 2, c.sand) }
    for (const x of [175, 303]) for (const y of [216,270]) r(x,y,4,4,c.accent)
    if (scene === 'games') for (const x of [91, 350]) for (let j = 0; j < 6; j++) r(x + j % 2 * 10, 223 + j * 11, 10, 11, c.sand)
    // Actual framed covers remain separate DOM images and are replaceable.
    if (scene === 'music' || scene === 'film') for (let i = 0; i < 4; i++) {
      const x = displayX(scene, i)
      lamp(x + 24, scene === 'music' ? 48 : 35)
      if (scene === 'music') {
        disc(x + 43, 83, 23); disc(x + 43, 83, 19, c.accent); disc(x + 43, 83, 17)
        disc(x + 43, 83, 6, c.sand); disc(x + 43, 83, 1, c.paper)
      } else { r(x - 2, 43, 52, 76); r(x - 1, 44, 50, 74, c.sand) }
    }
    const drawer = (x: number, y: number, w: number, h: number) => {
      frame(x,y,w,h,c.accent); r(x+2,y+2,w-4,2,c.sand); frame(x+w/2-5,y+h/2-2,10,4,c.sand)
    }
    const spines = (x: number, y: number, w: number, h: number) => {
      r(x,y,w,h)
      for(let j=0;j<w-3;j+=4) { r(x+j+1,y+2+j%3,2,h-4-j%3,j%3?c.sand:c.accent); r(x+j+1,y+h-5,2,1,c.paper) }
    }
    const table = (x: number, y: number, w: number, h: number) => {
      r(x+3,y+h-1,4,8); r(x+w-7,y+h-1,4,8)
      frame(x,y,w,h,c.accent); r(x+2,y+2,w-4,3,c.sand)
    }
    const renderObject = (o: Furniture) => {
      const {x,w,h,kind,rise}=o, y=o.y-rise, bottom=o.y+h
      // A narrow contact shadow keeps the objects grounded in all four colors.
      r(x+3,bottom,w,3,c.sand)
      if(kind === 'plant') { plant(x+w/2,bottom-2); return }
      if(kind === 'bins') {
        const n=Math.max(1,Math.floor(w/33)), cell=w/n
        table(x,y+rise-4,w,h+4)
        for(let i=0;i<n;i++) {
          const xx=x+i*cell+3
          frame(xx,y,cell-6,rise+2,c.accent)
          for(let j=0;j<4;j++) {
            frame(xx+2,y+3+j*5,cell-10,15,j%2?c.sand:c.paper)
            line(xx+4,y+5+j*5,cell-14,c.accent)
          }
          r(xx+5,y+22,cell-16,7,c.accent); r(xx+9,y+20,cell-24,8)
          drawer(xx-2,o.y+1,cell-2,h-2)
        }
      } else if(kind === 'shelf') {
        table(x,y,w,rise+h)
        const rows=w>100?1:3
        for(let j=0;j<rows;j++) spines(x+3,y+6+j*(rise+h-10)/rows,w-6,(rise+h-13)/rows)
        if(w>100) {
          for(let j=0;j<4;j++) { drawer(x+3+j*w/4,bottom-10,w/4-5,10); frame(x+8+j*w/4,y-7,20,8,c.sand) }
          disc(x+w-27,y-3,8); disc(x+w-27,y-3,4,c.sand)
        }
      } else if(kind === 'turntable') {
        table(x,o.y-3,w,h+3); drawer(x+3,o.y+5,w-6,h-7)
        frame(x+15,y+7,w-30,20,c.sand); disc(x+w/2,y+17,9); disc(x+w/2,y+17,3,c.paper)
        r(x+w-19,y+9,2,15); line(x+w-25,y+22,7)
        for(const xx of [x,x+w-12]) { frame(xx,y+2,12,25,c.accent); disc(xx+6,y+17,4); disc(xx+6,y+17,2,c.sand) }
        r(x+w-1,y-1,2,14); r(x+w+7,y-1,2,14); r(x+w+1,y-4,6,3)
      } else if(kind === 'bench') {
        table(x,y,w,rise+h-7)
        for(let j=0;j<3;j++) line(x+3,y+5+j*5,w-6,j%2?c.ink:c.sand)
        if(scene==='film') { frame(x+8,y-11,12,14,c.accent); for(let i=0;i<8;i++) disc(x+9+i*7%10,y-10+i*3%7,2,c.paper) }
      } else if(kind === 'sofa') {
        r(x+6,bottom-1,5,6); r(x+w-11,bottom-1,5,6)
        for(let i=0;i<3;i++) {
          const xx=x+4+i*(w-8)/3
          frame(xx,y,(w-8)/3-2,rise+3,c.accent); line(xx+3,y+4,(w-8)/3-8,c.sand)
          frame(xx,o.y-2,(w-8)/3-2,h,c.accent)
        }
        frame(x-2,o.y-7,7,h+7,c.accent); frame(x+w-5,o.y-7,7,h+7,c.accent)
        r(x+w-27,o.y-3,17,h+4,c.sand); for(let i=0;i<5;i++) line(x+w-27,o.y+i*5,17,c.accent)
      } else if(kind === 'screen') {
        frame(x,y,w,rise,c.ink); r(x+3,y+3,w-6,rise-6,c.sand)
        disc(x+w/2,y+22,9,c.paper)
        for(let j=0;j<13;j++) r(x+3,y+rise-4-j,w-6-Math.abs(6-j)*2,1,c.accent)
        table(x-3,o.y+1,w+6,h-2); frame(x+9,o.y-4,23,13,c.paper); disc(x+15,o.y+2,4); r(x+25,o.y,5,2)
        const spoke=ambientTick?Math.floor(ambientTick/1200)%2:0;r(x+14+spoke,o.y+1,1,2,c.sand)
      } else if(kind === 'booth') {
        frame(x,y,w,rise+h,c.accent); frame(x+3,y+3,w-6,9,c.paper)
        r(x+5,y+16,20,rise-12,c.sand); for(let j=0;j<4;j++)r(x+5+j*5,y+16,2,rise-12,c.accent)
        frame(x+w-15,y+18,10,14,c.ink);disc(x+w-10,y+24,3,c.paper)
        r(x+8,o.y+8,w-16,3,c.ink);r(x+19,o.y+8,9,8,c.paper)
      } else if(kind === 'popcorn' || kind === 'claw') {
        table(x,o.y,w,h); frame(x+2,y+8,w-4,rise-6,c.sand); r(x+5,y+11,w-10,rise-12,c.paper)
        frame(x,y,w,11,c.accent); for(let j=3;j<w-3;j+=8) r(x+j,y+2,4,7,c.paper)
        if(kind==='popcorn') { for(let j=0;j<30;j++) r(x+7+j*7%(w-13),o.y-5-j*3%14,2,2,j%2?c.accent:c.sand) }
        else {
          r(x+w/2,y+11,1,13); r(x+w/2-4,y+23,9,2); r(x+w/2-5,y+24,2,5); r(x+w/2+4,y+24,2,5)
          for(let j=0;j<3;j++) { disc(x+10+j*11,o.y-11,6,c.accent); disc(x+7+j*11,o.y-16,2); disc(x+13+j*11,o.y-16,2); r(x+8+j*11,o.y-12,1,1,c.paper) }
        }
        drawer(x+4,o.y+4,w-8,h-7)
      } else if(kind === 'cabinet') {
        frame(x,y,w,rise+h,c.accent); r(x+2,y+2,w-4,6,c.sand)
        // Clear bezel behind the separately rendered A4 artwork.
        frame(x+5,y+9,w-10,72,c.ink)
        frame(x-2,o.y-9,w+4,15,c.sand); r(x+10,o.y-12,2,12); disc(x+11,o.y-12,3)
        for(let j=0;j<3;j++) disc(x+w-21+j*6,o.y-3,2,c.accent)
        frame(x+12,o.y+10,w-24,9,c.ink); r(x+w/2-3,o.y+12,6,3,c.sand)
      } else if(kind === 'prizes') {
        table(x,y,w,rise+h); frame(x+3,y+8,w-6,rise-2,c.sand)
        for(let j=0;j<3;j++) { disc(x+9+j*12,y+21,5,c.accent); r(x+6+j*12,y+17,2,2); r(x+11+j*12,y+17,2,2) }
        frame(x+5,y-6,11,7,c.accent); frame(x+20,y-9,13,10,c.sand)
      } else if(kind === 'cocktail') {
        table(x+8,o.y-3,w-16,h+3); frame(x,y,w,rise,c.accent); frame(x+12,y+4,w-24,rise-8,c.sand)
        for(const xx of [x+2,x+w-9]) { disc(xx+3,y+8,3); r(xx+2,y+14,3,5,c.paper) }
        // The playable tabletop shows a tiny pantry of round food pieces.
        disc(x+23,y+17,4,c.accent); disc(x+32,y+16,5,c.ink); disc(x+44,y+17,4,c.accent)
        disc(x+28,y+8,3,c.accent); r(x+42,y+5,2,5,c.ink)
      } else if(kind === 'stool') {
        r(x+2,o.y,3,h); r(x+w-5,o.y,3,h); disc(x+w/2,y+5,w/2); disc(x+w/2,y+4,w/2-2,c.accent)
      } else if(kind === 'journal') {
        table(x,o.y-4,w,h+4); frame(x+5,y,w-10,rise+2,c.paper); r(x+w/2,y+2,1,rise-2,c.accent)
        for(let j=0;j<3;j++) { line(x+8,y+4+j*3,w/2-11,c.accent); line(x+w/2+3,y+4+j*3,w/2-11,c.accent) }
      } else if(kind === 'rack') {
        frame(x,y,w,rise+h,c.ink)
        for(let col=0;col<2;col++) for(let j=0;j<8;j++) {
          const xx=x+3+col*w/2, yy=y+4+j*11
          frame(xx,yy,w/2-5,9,c.sand); line(xx+9,yy+4,w/2-17); r(xx+3,yy+3,2,2,(j+Math.floor(ambientTick/900))%2?c.accent:c.ink)
        }
      } else if(kind === 'desk') {
        table(x,o.y-5,w,h+5); frame(x+5,y,w-24,rise-8,c.ink)
        for(let j=0;j<4;j++) line(x+9,y+5+j*5,w-38+j%2*5,c.sand)
        r(x+w/2-5,o.y-14,4,9); r(x+8,o.y-3,w-28,4,c.sand); disc(x+w-10,o.y-1,3,c.paper)
        drawer(x+w-20,o.y+6,17,h-8)
      } else {
        frame(x,y,w,rise+h,c.sand)
        for(let j=0;j<6;j++) { r(x+5+j*9,y+6,2,17,c.accent); frame(x+3+j*9,y+5,6,5,c.ink) }
        frame(x+7,y+30,w-14,22,c.ink); for(let j=0;j<3;j++) line(x+12,y+35+j*5,w-25,c.accent)
        drawer(x+4,o.y,w-8,h-3)
      }
    }
    // A recessed wooden door, lintel, jambs and a short doormat face the room.
    frame(219,281,42,42,c.accent); frame(224,285,32,35,c.ink)
    r(226,287,28,31,c.accent)
    if (effects?.doorId === 'exit' && effects.doorOpen > 0) {
      r(226,287,28,31,c.ink); r(226,287,Math.max(3,Math.round(28*(1-effects.doorOpen))),31,c.accent)
    } else { frame(230,291,20,12,c.sand); frame(230,306,20,9,c.accent); r(248,303,2,2,c.paper) }
    r(218,279,44,5); r(221,280,38,2,c.sand)
    r(220,318,40,4,c.sand); r(224,297,32,5,c.sand)
    // Furniture and the player share one depth ordering, including the rug's
    // central activity and the side aisles. No baked background furniture.
    const actors = furnishings[scene].map(o => ({y:o.y+o.h,draw:()=>renderObject(o)}))
    actors.push({y:player.y,draw:character})
    actors.sort((a,b)=>a.y-b.y).forEach(a=>a.draw())
    // Foreground jambs occlude the player naturally while stepping through.
    r(219,284,5,36,c.accent); r(256,284,5,36,c.accent)
    // The south-facing header and threshold belong in front of the cat too.
    r(218,279,44,5); r(221,280,38,2,c.sand)
    r(220,318,40,4,c.sand)

  }
  if (effects?.marker) {
    const { point, valid } = effects.marker, x = Math.round(point.x), y = Math.round(point.y)
    if (valid) { line(x-5,y-4,10,c.accent); line(x-5,y+4,10,c.accent); r(x-7,y-2,2,5,c.accent); r(x+6,y-2,2,5,c.accent) }
    else for(let i=-4;i<=4;i++) { r(x+i,y+i,1,1,c.accent); r(x-i,y+i,1,1,c.accent) }
  }
  ctx.restore()
}

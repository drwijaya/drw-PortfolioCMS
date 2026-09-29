import { drawWorld } from './draw'
import { drawCat } from './cat-sprite'
import { boatBob, createPixelScene, drawBird, drawBoat, drawCloud, drawFlag, drawSea } from './pixel-scene'
import type { Palette } from './palette'
import { HEIGHT, SPAWN, WIDTH, type Point } from './world'

export type CutscenePhase = 'title' | 'sailing' | 'arrival'
export const ARRIVAL_DURATION = 1100
export function arrivalPosition(elapsed: number): Point {
  return { x: SPAWN.x, y: Math.round(316+(SPAWN.y-316)*Math.min(1,Math.max(0,elapsed)/ARRIVAL_DURATION)) }
}

// Small distant buildings are rendered from the exact same native definitions.
// Each palette is cached once. No downloaded scene or sprite images are used.
const buildingCache = new Map<string, HTMLCanvasElement[]>()
function distantBuildings(c: Palette) {
  const key=Object.values(c).join(':')
  const cached=buildingCache.get(key)
  if(cached)return cached
  const sprites = (['homelab','music','film','games'] as const).map(id=>{
    const canvas=document.createElement('canvas');canvas.width=96;canvas.height=94
    const ctx=canvas.getContext('2d')
    if(ctx)createPixelScene(ctx,c).building({id,sign:'',x:4,y:15,w:88,h:67})
    return canvas
  })
  buildingCache.set(key,sprites)
  return sprites
}

export function drawCutscene(ctx: CanvasRenderingContext2D, phase: CutscenePhase, c: Palette, tick: number, beat: number) {
  const height=ctx.canvas.height
  if(phase==='arrival') {
    const position=arrivalPosition(beat)
    drawSea(ctx,c,tick,0,WIDTH,height)
    ctx.save();ctx.translate(0,Math.floor((height-HEIGHT)/2))
    drawWorld(ctx,'island',position,c,tick,beat<ARRIVAL_DURATION,3,1,undefined,{doorOpen:0,ambientTick:tick})
    ctx.restore()
    return position
  }
  const {r,line,disc,tree}=createPixelScene(ctx,c,tick)
  ctx.save();ctx.imageSmoothingEnabled=false
  r(0,0,WIDTH,height,c.paper)
  const horizon=Math.round(height*(height>440?.43:165/340))
  const shoreOffset=horizon-165
  // A stepped sun and spare clouds leave quiet sky for the title.
  disc(351,101+shoreOffset,33,c.sand)
  drawCloud(ctx,c,36,88+Math.floor(shoreOffset/2),68,tick)
  drawCloud(ctx,c,171,61+Math.floor(shoreOffset/3),47,tick+4300)
  drawCloud(ctx,c,370,79+Math.floor(shoreOffset/2),65,tick+1900)
  drawCloud(ctx,c,-16,134+shoreOffset,80,tick+5700)
  drawSea(ctx,c,tick,horizon,WIDTH,height)
  line(0,horizon-1,WIDTH,c.sand)
  ctx.save();ctx.translate(0,shoreOffset)
  // Distant island: terraced land and familiar building silhouettes.
  r(252,162,180,10,c.accent);r(244,169,196,5,c.sand)
  r(263,146,155,18,c.sand);r(281,134,121,17,c.sand)
  r(307,122,63,17,c.sand)
  for(const [x,y,w] of [[256,160,9],[273,151,6],[395,151,12],[423,166,6],[295,141,7]])r(x,y,w,4,c.accent)
  const sprites=distantBuildings(c)
  for(const [index,x,y] of [[0,269,116],[1,320,103],[2,365,121],[3,389,132]])ctx.drawImage(sprites[index],x,y,38,37)
  drawFlag(ctx,c,365,136,tick)
  for(const [x,y] of [[253,161],[416,160]]) {
    // Shared canopy shape, drawn at a fixed native size on the distant shore.
    tree(x,y)
  }
  const foam=Math.floor(tick/400)%6
  for(let i=0;i<8;i++) {
    const shift=(foam+i*2)%6
    line(246+i*25+shift,177+(i%2),12-shift,c.sand)
  }
  ctx.restore()
  // Foreground travel settles into a bobbing loop; the title shares this pose.
  const settle=phase==='sailing'?Math.round(9*(1-Math.min(1,beat/1200))):9
  const bx=144, by=Math.round(height*(height>440?.64:256/340))+settle
  const boatScale=height>440?3:2
  ctx.save();ctx.translate(bx,by);ctx.scale(boatScale,boatScale)
  drawBoat(ctx,c,0,0,tick,true)
  drawCat(ctx,{x:0,y:-4+boatBob(tick)},3,false,tick,c)
  ctx.restore()
  drawBird(ctx,c,211+Math.floor(tick/1400)%8,120+shoreOffset,tick)
  drawBird(ctx,c,422,109+shoreOffset,tick+2200)
  // Occasional short gusts on the open water, rather than a particle blanket.
  const gust=Math.floor(tick/650)%12
  if(gust===2||gust===3) {line(40+gust*3,215+shoreOffset,17,c.sand);line(64+gust*3,212+shoreOffset,6,c.sand)}
  ctx.restore()
  return {x:bx,y:by}
}

import { BOARD, FOODS, type GameState } from './config'
export type PantryPalette = { paper: string; sand: string; ink: string; accent: string }
export const CLASSIC: PantryPalette = { paper: '#fff1ea', sand: '#e3d4bd', ink: '#2e2a26', accent: '#9c5833' }
export const NIGHT: PantryPalette = { paper: '#1c1310', sand: '#3f2e23', ink: '#f2ece3', accent: '#d98a5c' }
const cache = new Map<string, HTMLCanvasElement>()
/** Original food illustrations rasterized with four opaque colors. */
export function foodSprite(tier: number, c: PantryPalette) {
  const key = `${tier}:${c.paper}`
  const found = cache.get(key); if (found) return found
  const canvas = document.createElement('canvas'); canvas.width = 40; canvas.height = 40
  const ctx = canvas.getContext('2d')!
  const r = (x:number,y:number,w:number,h:number,color=c.ink) => {ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
  const disk = (x:number,y:number,rad:number,color=c.ink) => {
    for(let yy=-rad;yy<=rad;yy++)for(let xx=-rad;xx<=rad;xx++)if(xx*xx+yy*yy<=rad*rad)r(x+xx,y+yy,1,1,color)
  }
  disk(19,19,19); disk(19,19,17,c.sand)
  if(tier===0){ disk(19,19,14,c.accent);disk(17,16,10,c.sand);for(const [x,y] of [[11,13],[21,9],[24,19],[15,25],[8,20],[20,15]])r(x,y,2,2,c.paper) }
  else if(tier===1){disk(19,19,14,c.accent);for(let y=10;y<31;y+=5)for(let x=10;x<31;x+=6)if((x-19)**2+(y-19)**2<150)r(x+(y%2),y,2,1,c.paper);r(15,12,6,2,c.sand)}
  else if(tier===2){disk(19,19,13,c.ink);disk(19,18,12,c.accent);disk(24,12,11,c.sand);for(const [x,y] of [[9,21],[11,26],[15,29],[20,29],[25,27]])r(x,y,2,2,c.paper)}
  else if(tier===3){disk(19,19,14,c.accent);disk(18,17,11,c.paper);disk(19,19,5);disk(19,19,3,c.sand);for(const [x,y] of [[12,13],[22,9],[25,22],[14,27]])r(x,y,3,2,c.accent)}
  else if(tier===4){disk(19,21,13,c.paper);r(10,28,20,2,c.accent);for(const x of [12,18,24]){r(x,13,2,8,c.sand);r(x+2,10,2,4,c.accent)}r(17,8,6,3,c.accent)}
  else if(tier===5){disk(19,17,13,c.accent);r(6,19,27,11,c.sand);r(6,20,27,3);r(8,24,24,3,c.accent);r(10,28,20,4);r(10,28,20,2,c.paper);for(const x of [12,19,25])r(x,11+(x%2)*2,2,1,c.paper)}
  else if(tier===6){disk(19,19,15,c.accent);disk(19,19,12,c.paper);r(19,7,1,25,c.accent);r(7,19,25,1,c.accent);for(const [x,y] of [[13,13],[25,14],[12,25],[24,26]]){disk(x,y,3,c.accent);r(x,y,1,1)}}
  else if(tier===7){disk(19,21,14);disk(19,18,13,c.paper);for(let y=12;y<25;y+=4){r(9,y,20,1,c.accent);r(y,10,1,14,c.sand)}r(8,27,23,4,c.accent);r(12,32,15,2);r(24,5,2,22);r(29,5,2,21,c.accent)}
  else if(tier===8){disk(17,21,13,c.accent);for(let y=13;y<31;y+=4)for(let x=8;x<25;x+=5)if((x-17)**2+(y-21)**2<130)r(x,y,2,1,c.sand);disk(25,14,8,c.paper);disk(25,14,4,c.accent);r(11,9,4,2)}
  else {disk(19,29,14,c.accent);for(let y=6;y<=29;y++)r(19-Math.floor((y-6)/2),y,1+Math.floor((y-6)/2)*2,1,c.paper);for(let y=12;y<28;y+=4)r(18-Math.floor((y-12)/2),y,3,1,c.accent);disk(8,27,3);disk(29,27,3);r(12,32,15,2,c.paper)}
  cache.set(key,canvas);return canvas
}
export function paintFood(ctx:CanvasRenderingContext2D,tier:number,x:number,y:number,radius:number,c:PantryPalette){
  ctx.imageSmoothingEnabled=false;ctx.drawImage(foodSprite(tier,c),Math.round(x-radius),Math.round(y-radius),radius*2,radius*2)
}
export function drawPantry(ctx:CanvasRenderingContext2D,state:GameState,aim:number,c:PantryPalette){
  ctx.imageSmoothingEnabled=false;ctx.fillStyle=c.paper;ctx.fillRect(0,0,BOARD.width,BOARD.height)
  ctx.fillStyle=c.sand
  for(let y=90;y<BOARD.height;y+=38)for(let x=13+(y%7);x<BOARD.width;x+=43)ctx.fillRect(x,y,3,1)
  ctx.fillStyle=c.ink;ctx.fillRect(0,0,3,BOARD.height);ctx.fillRect(BOARD.width-3,0,3,BOARD.height);ctx.fillRect(0,BOARD.height-5,BOARD.width,5)
  ctx.fillStyle=state.warning>0?c.accent:c.sand
  for(let x=5;x<BOARD.width-5;x+=12)ctx.fillRect(x,BOARD.line,7,state.warning>0?2:1)
  for(const food of state.foods)paintFood(ctx,food.tier,food.x,food.y,FOODS[food.tier].radius,c)
  if(!state.ended){
    const r=FOODS[state.current].radius
    ctx.fillStyle=c.accent;for(let y=r*2+9;y<BOARD.line-2;y+=6)ctx.fillRect(Math.round(aim),y,1,2)
    paintFood(ctx,state.current,aim,r+3,r,c);ctx.fillStyle=c.ink;ctx.fillRect(Math.round(aim)-3,1,7,2)
  }
}

import type { Point } from './world'
import type { Palette } from './palette'

// Hand-authored palette-role pixels, shared by the boat, dock, and playable cat.
// The supplied tabby guides the ears, cream muzzle/paws, stripes, and curled tail.
const front = [
  '..ii........ii..',
  '..iai......iai..',
  '..iaaiiiiiiaai..',
  '.iaaiaaiiaaiaai.',
  '.iaaaaiiaaaaai.',
  'iaaaaaaaaaaaaai',
  'iaaiiaaaaiiaaai',
  'iaaiiaaaaiiaaai',
  '.iaaappppaaai..',
  '..iapippipai...',
  '...iappppai....',
  '...iaaaaai.....',
  '...iaiaiai.....',
  '...iaiaiai.....',
  '...iaaaaai.....',
  '...iapppai.....',
  '...ipaapii.....',
  '...ippippi.....',
  '....ii.ii......',
]
const back = [
  '..ii........ii..',
  '..iai......iai..',
  '..iaaiiiiiiaai..',
  '.iaaiaaiiaaiaai.',
  '.iaaaaiiaaaaai.',
  '.iaaaaiiaaaaai.',
  '..iaaaaaaaaai..',
  '...iaaaaaaai...',
  '....iaaaaai....',
  '....iaiaiai....',
  '....iaiaiai....',
  '....iaaaaai....',
  '....iaiaiai....',
  '....iaiaiai....',
  '....iaaaaai....',
  '....iapppai....',
  '....ipaapii....',
  '....ippippi....',
  '.....ii.ii.....',
]
const side = [
  '....ii..................',
  '....iai.................',
  '...iaaii................',
  '..iaaaaai...............',
  '.iaaaaaai...............',
  '.iaiiaaai...............',
  'ipaiiaaai...............',
  'ipppaaaaiiiiiiiiii......',
  '.ippaaaaaaiaiaaaaai.....',
  '..iaaaaaaaiaiaaaaai.....',
  '...iaaaaaaaaaaaaai......',
  '...ipaaaapppaaaai.......',
  '...ipaaaai.ipaaai.......',
  '...ippipii.ippipi.......',
  '....ii.ii...ii.ii.......',
]

// Each point is the centre of a three-pixel-wide tail. Overlapping outlines
// make a continuous curve from the rump; the curl stays below the ears.
const sideTail = [[4,-6],[5,-6],[6,-7],[7,-8],[8,-9],[8,-10],[8,-11],[8,-12],[7,-13],[6,-13],[5,-12]]
const frontTail = [[1,-4],[2,-4],[3,-5],[4,-5],[5,-6],[6,-7],[7,-8],[8,-9],[8,-10],[7,-11],[6,-11]]
const backTail = [[0,-4],[1,-4],[2,-5],[3,-5],[4,-6],[5,-7],[6,-8],[7,-9],[7,-10],[6,-11],[5,-11],[4,-10]]

export function drawCat(ctx: CanvasRenderingContext2D, player: Point, facing: number, walking: boolean, tick: number, c: Palette) {
  const rows = facing === 1 || facing === 2 ? side : facing === 3 ? back : front
  const width = facing === 1 || facing === 2 ? 24 : 16
  const step = walking ? Math.floor(tick/120)%4 : 0
  const colors: Record<string,string> = { i:c.ink, a:c.accent, p:c.paper, s:c.sand }
  const x=Math.round(player.x), y=Math.round(player.y)
  ctx.fillStyle=c.sand;ctx.fillRect(x-7,y,14,2)
  ctx.save();ctx.translate(x,y)
  if(facing===1)ctx.scale(-1,1)
  const tail = width===24 ? sideTail : facing===3 ? backTail : frontTail
  const flick = Math.floor(tick/650)%10===7
  const drawTail = () => {
    // Only the last pixel changes pose; the tail's base never detaches.
    const points = tail.map(([tx,ty],i)=>[tx,ty+(flick&&i===tail.length-1?1:0)])
    ctx.fillStyle=c.ink
    for(const [tx,ty] of points)ctx.fillRect(tx-1,ty-1,3,3)
    points.forEach(([tx,ty],i)=>{
      ctx.fillStyle=i===points.length-1?c.paper:i===4?c.ink:c.accent
      ctx.fillRect(tx,ty,1,1)
    })
  }
  if(facing!==3)drawTail()
  rows.forEach((row,sy)=>{
    for(let sx=0;sx<row.length;sx++) {
      const color=colors[row[sx]]
      if(!color)continue
      let foot=0
      if(walking&&sy>=rows.length-3)foot=sx<width/2?(step===1?-1:0):(step===3?-1:0)
      ctx.fillStyle=color
      ctx.fillRect(sx-Math.floor(width/2),sy-rows.length+1+foot,1,1)
    }
  })
  // From behind, the base is visible over the lower back instead of vanishing
  // underneath the body sprite. Other views correctly occlude the root.
  if(facing===3)drawTail()
  ctx.restore()
}

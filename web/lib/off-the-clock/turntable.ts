export const spindle = { x:270, y:310 }
export const pivot = { x:535, y:90 }
export const armLength = 350
export const outerGroove = 231
export const innerGroove = 109

export function grooveRadius(index:number, count:number, progress=0) {
  return outerGroove - (index + .15 + Math.max(0,Math.min(1,progress))*.7) * (outerGroove-innerGroove)/count
}
export function trackAtRadius(radius:number, count:number) {
  if(radius>outerGroove+5 || radius<innerGroove-5)return null
  return Math.max(0,Math.min(count-1,Math.floor((outerGroove-radius)/(outerGroove-innerGroove)*count)))
}
export function armAngle(radius:number) {
  const dx=spindle.x-pivot.x,dy=spindle.y-pivot.y,d=Math.hypot(dx,dy)
  const cosine=(d*d+armLength*armLength-radius*radius)/(2*d*armLength)
  return (Math.atan2(dy,dx)-Math.acos(Math.max(-1,Math.min(1,cosine))))*180/Math.PI-90
}
export function needlePoint(radius:number) {
  const angle=(armAngle(radius)+90)*Math.PI/180
  return {x:pivot.x+Math.cos(angle)*armLength,y:pivot.y+Math.sin(angle)*armLength}
}
export function formatTime(seconds:number) {
  const safe=Number.isFinite(seconds)?Math.max(0,Math.floor(seconds)):0
  return `${Math.floor(safe/60)}:${String(safe%60).padStart(2,'0')}`
}

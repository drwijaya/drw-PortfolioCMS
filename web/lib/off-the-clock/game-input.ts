import type { Point, Hotspot, Scene } from './world'
import { contains, hotspots } from './world'
export const WALK_SPEED = 78
export function pointerToWorld(client: Point, rect: {left:number;top:number;width:number;height:number}, camera: Point, zoom: number): Point | null {
  const x=(client.x-rect.left)/rect.width,y=(client.y-rect.top)/rect.height
  if(x<0||x>1||y<0||y>1||!rect.width||!rect.height)return null
  return {x:x*480/zoom+camera.x,y:y*340/zoom+camera.y}
}
export function interactionTarget(scene: Scene, point: Point, facing: number, previous?: Hotspot) {
  const direction=[[0,1],[1,0],[-1,0],[0,-1]][facing] || [0,1]
  const candidates=hotspots(scene).filter(h=>contains(point,h,17))
  const score=(h:Hotspot)=>{const x=h.x+h.w/2-point.x,y=h.y+h.h/2-point.y;return Math.hypot(x,y)-(x*direction[0]+y*direction[1]>0?5:0)}
  candidates.sort((a,b)=>score(a)-score(b))
  const best=candidates[0]
  const retained = candidates.find(h=>h.id===previous?.id)
  return retained&&best&&score(retained)<=score(best)+7?retained:best
}

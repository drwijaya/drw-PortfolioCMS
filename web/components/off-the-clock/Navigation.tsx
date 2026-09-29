import { TransitionLink } from '@/components/navigation/RouteTransition'
import { rooms, type RoomId } from '@/content/off-the-clock'
import styles from './OffTheClock.module.css'

export function BackIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-7 7 7 7M5 12h14" /></svg>
}
export function OffTheClockBreadcrumb() {
  return <nav className={styles.breadcrumb} aria-label="Breadcrumb"><TransitionLink href="/playground">Playground</TransitionLink><span aria-hidden="true">/</span><span aria-current="page">Off the Clock</span></nav>
}
export function RoomBreadcrumb({ room, journal }: { room: RoomId; journal?: string }) {
  return <nav className={styles.breadcrumb} aria-label="Breadcrumb"><TransitionLink href="/playground/offtheclock">Off the Clock</TransitionLink><span aria-hidden="true">/</span>{journal ? <><TransitionLink href={`/playground/offtheclock/${room}`}>{rooms[room].name}</TransitionLink><span aria-hidden="true">/</span><span aria-current="page">{journal}</span></> : <span aria-current="page">{rooms[room].name}</span>}</nav>
}

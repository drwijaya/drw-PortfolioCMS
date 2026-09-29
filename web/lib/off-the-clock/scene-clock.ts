/** Shared active time survives title/scene/world handoffs, but not hidden time. */
export type SceneClock = { elapsed: number }
export function advanceSceneClock(clock: SceneClock, delta: number) {
  clock.elapsed += Math.max(0, Math.min(delta, 250))
}

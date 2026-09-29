export const RULES_VERSION = 'pantry-1'
export const BOARD = { width: 320, height: 440, line: 64 } as const
export const LIMITS = { ticks: 60 * 60 * 20, drops: 1200, bodies: 160, cooldown: 39 } as const
export const FOODS = [
  { name: 'Klepon', radius: 12, points: 0 },
  { name: 'Onde-onde', radius: 16, points: 10 },
  { name: 'Pastel', radius: 21, points: 20 },
  { name: 'Donut', radius: 26, points: 40 },
  { name: 'Bakpao', radius: 32, points: 80 },
  { name: 'Burger', radius: 39, points: 160 },
  { name: 'Pizza', radius: 46, points: 320 },
  { name: 'Mie ayam', radius: 54, points: 640 },
  { name: 'Nasi goreng', radius: 63, points: 1280 },
  { name: 'Tumpeng', radius: 74, points: 2560 },
] as const
export type Drop = { tick: number; x: number }
export type FoodView = { id: number; tier: number; x: number; y: number; angle: number }
export type GameState = {
  tick: number; score: number; merges: number; highest: number; drops: number
  current: number; next: number; ready: boolean; warning: number
  ended: 'overflow' | 'limit' | 'finished' | null; foods: FoodView[]
}

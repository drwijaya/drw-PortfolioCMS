export type IntroPhase = 'title' | 'sailing' | 'arrival' | 'playing'
export const INTRO_SESSION_KEY = 'off-clock-intro-v1'
export const introSlides = {
  sailing: {
    title: 'A little way from home',
    image: 'sailing.webp',
    description: 'A tabby sits in a wooden rowboat approaching a rocky island with four buildings and a central dock.',
    lines: ['Day after day, the little tabby sailed.', 'Then, an island appeared on the horizon.'],
  },
  arrival: {
    title: 'Make yourself at home',
    image: 'arrival.webp',
    description: 'A tabby stands on an angled wooden dock, looking toward four buildings on the rocky shore. Its rowboat is tied to the right.',
    lines: ['Four little places. A whole island of stories.', 'The tabby stepped ashore.'],
  },
} as const

let entered = false
export function hasEnteredIsland() {
  try { return entered || sessionStorage.getItem(INTRO_SESSION_KEY) === 'entered' } catch { return entered }
}
export function rememberIslandEntry() {
  entered = true
  try { sessionStorage.setItem(INTRO_SESSION_KEY, 'entered') } catch { /* Session memory is enough when storage is blocked. */ }
}

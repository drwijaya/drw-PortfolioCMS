'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { preloadBuildingSprites } from '@/lib/off-the-clock/building-sprites'
import styles from './GameAssetLoader.module.css'

const decoded = new Map<string, HTMLImageElement>()
function prepareImage(src: string) {
  if (decoded.has(src)) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const image = new Image()
    const timeout = setTimeout(() => reject(new Error('Image download timed out')), 45000)
    image.onload = () => {
      void image.decode().then(() => {
        decoded.set(src, image)
        clearTimeout(timeout)
        resolve()
      }, error => { clearTimeout(timeout); reject(error) })
    }
    image.onerror = () => { clearTimeout(timeout); reject(new Error('Image unavailable')) }
    image.src = src
  })
}

/** Keep the game unmounted until required art has downloaded and decoded. */
export function GameAssetLoader({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    let alive = true
    const tasks = [
      preloadBuildingSprites(),
      ...['title-island.webp', 'sailing.webp', 'arrival.webp'].map(file =>
        prepareImage(`/img/off-the-clock/intro/illustrated/${file}`)),
    ]
    // Wait for every task to settle before enabling retry: no competing attempts.
    void Promise.allSettled(tasks.map(task => task.then(() => {
      if (alive) setCompleted(value => value + 1)
    }))).then(results => {
      if (alive) setState(results.every(result => result.status === 'fulfilled') ? 'ready' : 'error')
    })
    return () => { alive = false }
  }, [attempt])
  if (state === 'ready') return children
  return <section className={styles.loader} data-game-loading={state} aria-label="Loading Off the Clock">
    <div className={styles.panel}>
      <p className={styles.title}>OFF THE CLOCK</p>
      <p role="status" aria-live="polite">{state === 'error' ? 'Some artwork couldn’t load.' : 'Preparing your island…'}</p>
      <progress max={4} value={completed} aria-label="Required artwork loaded" />
      <p>{state === 'error' ? 'Check your connection, then try again.' : 'Loading buildings and story pictures. Slow connections may take a moment.'}</p>
      {state === 'error' && <button onClick={() => { setCompleted(0); setState('loading'); setAttempt(value => value + 1) }}>Retry loading</button>}
      <Link href="/works">Back to the website</Link>
    </div>
  </section>
}

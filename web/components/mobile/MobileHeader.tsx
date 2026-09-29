import { getProfile } from '@/lib/content'
import { MobileHeaderNav } from './MobileHeaderNav'
import styles from './Mobile.module.css'

/**
 * The whole of the top edge on a phone: a wordmark, centred, and nothing
 * else.
 *
 * The column this replaces spent 284px up here on an identity nobody had
 * scrolled to read, and pushed the first line of every page to 375px — 43%
 * of the screen. Identity moves into the drawer, where it is one tap away
 * and costs the reading surface nothing. What is left is the one thing a
 * header is actually for: knowing whose site this is, and getting home.
 *
 * The theme toggle went to the drawer for the same reason. A header with two
 * things in it has a layout; a header with one thing in it has a centre.
 */
export async function MobileHeader() {
  const profile = await getProfile()

  return (
    <>
      {/* The band the page dissolves into as it scrolls under the wordmark.
          It is a SIBLING of the bar, not its ::before, and that is the whole
          point: a named view-transition element is snapshotted at its own
          border box, and this band is wider and taller than the bar it sits
          behind. As a pseudo-element it vanished for the length of every
          route change, and the outgoing and incoming pages were both visible
          in the strip around the floating bar. */}
      <div className={styles.veil} data-chrome="veil" data-edge="top" aria-hidden />
      <header className={styles.header} data-chrome="header">
        <MobileHeaderNav homeLabel={`${profile.fullName} — home`} />
      </header>
    </>
  )
}

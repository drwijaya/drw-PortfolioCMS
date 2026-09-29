import { TransitionLink } from '@/components/navigation/RouteTransition'
import styles from './Sidebar.module.css'

export interface NavTarget {
  slug: string
  title: string
}

/**
 * Prev and next along the /works sequence, in the reader column.
 *
 * The sequence loops, matching the work carousel at the end of each study.
 * Explicit directions preserve the established Previous/Next slide even
 * when the destination wraps from the last project to the first.
 *
 * A dim half (when fewer than two works exist) is decoration, so it is `aria-hidden` rather than
 * `aria-disabled`: a bare span is exposed as text, not as a control, and an
 * ARIA state with no widget to attach to says nothing to a screen reader.
 * The absence of the link is the message.
 *
 * `data-cursor` is written directly rather than through `useCursor()`. It
 * resolves to a constant, and reading it from context would make this a
 * client component for no gain. See components/cursor/CursorProvider.tsx.
 */
export function ProjectNav({
  prev,
  next,
}: {
  prev: NavTarget | null
  next: NavTarget | null
}) {
  // A single-project site has neither, and an empty landmark is worse than
  // no landmark: it shows up in screen-reader region lists with nothing in
  // it to operate.
  if (!prev && !next) return null

  return (
    <nav className={styles.projectNav} aria-label="Project navigation">
      {prev ? (
        <TransitionLink
          href={`/works/${prev.slug}`}
          direction="back"
          rel="prev"
          className={styles.projectNavLink}
          aria-label={`Previous project: ${prev.title}`}
          data-cursor="soft"
        >
          <span className={styles.projectNavChevron} data-side="prev" aria-hidden />
          <span>Prev</span>
        </TransitionLink>
      ) : (
        <span
          className={`${styles.projectNavLink} ${styles.projectNavEnd}`}
          aria-hidden
        >
          <span className={styles.projectNavChevron} data-side="prev" />
          <span>Prev</span>
        </span>
      )}

      {next ? (
        <TransitionLink
          href={`/works/${next.slug}`}
          direction="forward"
          rel="next"
          className={styles.projectNavLink}
          aria-label={`Next project: ${next.title}`}
          data-cursor="soft"
        >
          <span>Next</span>
          <span className={styles.projectNavChevron} data-side="next" aria-hidden />
        </TransitionLink>
      ) : (
        <span
          className={`${styles.projectNavLink} ${styles.projectNavEnd}`}
          aria-hidden
        >
          <span>Next</span>
          <span className={styles.projectNavChevron} data-side="next" />
        </span>
      )}
    </nav>
  )
}

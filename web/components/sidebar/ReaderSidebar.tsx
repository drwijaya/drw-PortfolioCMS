import { AnalyticsStamp } from '@/components/cms/AnalyticsStamp'
import { ExtraNavigation } from '@/components/cms/ExtraNavigation'
import Image, { getImageProps } from '@/components/cms/ContentImage'

import { TransitionLink } from '@/components/navigation/RouteTransition'
import { ProjectNav } from './ProjectNav'
import { ReadingRail, type Chapter } from './ReadingRail'
import { SidebarEntrance } from './SidebarEntrance'
import { ThemeToggle } from './ThemeToggle'
import {
  getProfile,
  getProjectNeighbours,
  getWorkDetailForProject,
} from '@/lib/content'
import type { Project } from '@/lib/types'
import { workTypeLabel } from '@/lib/work'
import styles from './Sidebar.module.css'

/**
 * Warm the neighbours' chip images.
 *
 * `priority` only preloads once the sidebar has rendered, which on a soft
 * navigation is a handful of frames before the view transition snapshots the
 * destination. That is not enough to fetch and decode, so the new column
 * would be captured with an empty chip and the thumbnail would pop in after
 * the slide. next/link prefetches the RSC payload, never the images it
 * references, so this has to be asked for separately, and it has to be the
 * URL next/image will actually request or it warms the wrong cache entry.
 *
 * No `href`. For a `fill` image `props.src` is the LARGEST candidate
 * (w=1920), so a browser that ignores `imagesrcset` would fetch a 1920px
 * file for a 248px column. next/image's own priority preload omits it here
 * for the same reason, and the srcset alone describes the whole set.
 */
function warmThumb(project: Project) {
  const { props } = getImageProps({
    src: project.thumb,
    alt: '',
    fill: true,
    sizes: '248px',
  })
  return { slug: project.slug, srcSet: props.srcSet }
}

/**
 * The column while you are reading a long-form work page. Identity gives way to
 * wayfinding: the thumbnail you clicked lands here, and everything the old
 * top bar carried (back link, project, chapter, progress) carries on in
 * the space the site already spends on navigation.
 *
 * Rendered on the server by the @sidebar slot, so a cold load never paints
 * the ordinary column first.
 */
export async function ReaderSidebar({ project }: { project: Project }) {
  const [profile, detail, neighbours] = await Promise.all([
    getProfile(),
    getWorkDetailForProject(project),
    getProjectNeighbours(project.slug),
  ])

  const chapters: Chapter[] =
    detail?.sections.map((s) => ({
      id: s.id,
      label: s.label,
      lead: s.lead,
    })) ?? []

  const warm = [neighbours.prev, neighbours.next]
    .filter((p): p is Project => Boolean(p))
    .map(warmThumb)

  return (
    /* Same drawer contract as the identity column. On a phone this one is
       never fully shut: the card stays on screen while you read, and the
       chevron adds the chapter index above it. */
    <aside
      id="dock-panel"
      tabIndex={-1}
      className={`${styles.sidebar} ${styles.reader}`}
    >
      {/* Low priority on purpose: nobody has asked for these yet, and at the
          default they would bid against the chip and hero this page is
          actually judged on. */}
      {warm.map((w) => (
        <link
          key={w.slug}
          rel="preload"
          as="image"
          fetchPriority="low"
          imageSrcSet={w.srcSet}
          imageSizes="248px"
        />
      ))}

      <SidebarEntrance variant="reader">
      <div className={`${styles.top} ${styles.readerTop}`}>
        <TransitionLink href="/works" className={styles.readerBack}>
          <span className={styles.readerBackArrow} aria-hidden />
          <span>Back to works</span>
        </TransitionLink>
        <ThemeToggle />
      </div>

      {/* `display: contents` on a desktop, so the column is unchanged. On a
          phone it becomes the card row: thumbnail and title on the left,
          prev/next on the right, the way the sketch has it. */}
      <div className={styles.readerCard}>
      <div className={styles.readerHead}>
        {/* A plain image. The tile-to-chip morph was retired when the frame
            started leaving /works as one piece with the stage. */}
        <span className={styles.readerChip}>
          <Image
            src={project.thumb}
            alt=""
            fill
            sizes="(max-width: 679px) 72px, 248px"
            priority
            className={styles.readerChipImg}
          />
        </span>

        <p className={styles.readerProject}>{project.title}</p>
        <p className={styles.readerMeta}>
          {workTypeLabel(project.presentationType)} · {project.practice} ·{' '}
          {project.year}
        </p>
      </div>

      <ProjectNav
        prev={
          neighbours.prev && {
            slug: neighbours.prev.slug,
            title: neighbours.prev.title,
          }
        }
        next={
          neighbours.next && {
            slug: neighbours.next.slug,
            title: neighbours.next.title,
          }
        }
      />
      </div>

      {chapters.length > 0 && detail && (
        <ReadingRail chapters={chapters} slug={detail.slug} />
      )}

      <ExtraNavigation/>
        <div className={styles.foot}>
        <TransitionLink
          href="/works"
          className={styles.mark}
          aria-label={profile.fullName}
        >
          <Image
            src={profile.sidebarMark??"/logo-wordmark.png"}
            alt=""
            width={747}
            height={334}
            sizes="42px"
            className={styles.markImg}
          />
        </TransitionLink>
        <AnalyticsStamp year={new Date(profile.updatedAt).getFullYear()} text={profile.footerText} className={`${styles.stamp} ${styles.analyticsLink}`}/>
      </div>
      </SidebarEntrance>
    </aside>
  )
}

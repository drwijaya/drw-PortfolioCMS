import Image from '@/components/cms/ContentImage'

import { TransitionLink } from '@/components/navigation/RouteTransition'
import { sizeOf } from '@/content/image-sizes'
import type { Project } from '@/lib/types'
import { projectTransitionNames, vt } from '@/lib/view-transition'
import { workTypeLabel } from '@/lib/work'

/** The fallback view for a project that has no long-form case study yet. */
export function CompactDetail({ project }: { project: Project }) {
  const { width, height } = sizeOf(project.hero ?? project.thumb)
  const transitionNames = projectTransitionNames(project.slug)

  return (
    <article className="detail-page-content">
      <nav className="detail-page-nav">
        <TransitionLink href="/works" className="detail-page-back">
          ← All works
        </TransitionLink>
        <div className="detail-page-actions">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-page-btn detail-page-github"
            >
              Source code
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-page-btn detail-page-demo"
            >
              Live demo
            </a>
          )}
        </div>
      </nav>

      <header className="detail-hero">
        <span className="detail-eyebrow">
          {workTypeLabel(project.presentationType)} · {project.practice} ·{' '}
          {project.year}
        </span>
        <h1 {...vt(transitionNames.title, 'detail-title')}>
          {project.title}
        </h1>
        <p className="detail-sub">{project.cardStatement}</p>

        {project.methods.length > 0 && (
          <div className="detail-tags">
            {project.methods.map((t) => (
              <span className="cs-tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="cs-figure-frame">
        <Image
          src={project.hero ?? project.thumb}
          alt={project.title}
          width={width}
          height={height}
          quality={90}
          sizes="(max-width: 899px) 100vw, 900px"
          {...vt(transitionNames.image, 'cs-figure-img')}
          priority
        />
      </div>

      <p className="detail-note">
        A full {workTypeLabel(project.presentationType).toLowerCase()} is still
        being prepared.
      </p>
    </article>
  )
}

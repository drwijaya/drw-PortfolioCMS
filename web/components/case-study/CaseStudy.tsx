import { BlockRenderer } from './BlockRenderer'
import { CaseStudyScroll } from './CaseStudyScroll'
import { ZoomableFigure } from './ZoomableFigure'
import { StoryGallery } from './StoryGallery'
import { ExperimentExplorer } from './ExperimentExplorer'
import { EvidenceComparison } from './EvidenceComparison'
import { FooterWorkCarousel } from './FooterWorkCarousel'
import { walkthroughs } from '@/content/case-studies/walkthroughs'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { resolveSectionBeats } from '@/lib/case-study/layouts'
import type {
  CaseStudy as CaseStudyType,
  Project,
  WorkDetail as WorkDetailType,
} from '@/lib/types'
import { projectTransitionNames, vt } from '@/lib/view-transition'

const pad = (n: number) => String(n).padStart(2, '0')

export function WorkDetail({
  detail,
  project,
}: {
  detail: WorkDetailType
  project: Project
}) {
  const transitionNames = projectTransitionNames(project.slug)
  const isCaseStudy = detail.presentationType === 'case-study'
  const overviewMeta = isCaseStudy && detail.client
    ? [
        { label: 'Client', value: detail.client },
        ...detail.meta.filter((item) => item.label !== 'Role'),
      ]
    : detail.meta

  return (
    <CaseStudyScroll>
      <article
        className={`cs-root cs-editorial${isCaseStudy ? ' cs-storytelling' : ''}`}
        data-case-study={detail.slug}
        data-presentation={detail.presentationType}
      >
        <header className="cs-hero" id="cs-overview">
          <span className="cs-hero-eyebrow cs-reveal">{detail.eyebrow}</span>
          <h1 {...vt(transitionNames.title, 'cs-hero-title cs-reveal')}>
            {detail.title}
          </h1>
          {!isCaseStudy && detail.client && (
            <p className="cs-hero-client cs-reveal">{detail.client}</p>
          )}
          <p className="cs-hero-sub cs-reveal">{detail.subtitle}</p>
          {isCaseStudy && (
            <p className="cs-overview-summary cs-reveal">
              {detail.overview.summary}
            </p>
          )}

          <dl className="cs-byline cs-reveal">
            {overviewMeta.map((item) => (
              <div className="cs-byline-item" key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>

          {isCaseStudy && (
            <div className="cs-overview-details">
              <section className="cs-overview-row cs-reveal" aria-labelledby="cs-role-title">
                <div className="cs-overview-label">
                  <h2 id="cs-role-title">My role</h2>
                  <div className="cs-overview-role-tags" aria-label="Methods and tools">
                    {detail.stack.map((item) => (
                      <span className="cs-tag" key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <p className="cs-overview-role-copy">{detail.overview.role}</p>
              </section>

              <section className="cs-overview-row cs-reveal" aria-labelledby="cs-objectives-title">
                <div className="cs-overview-label">
                  <h2 id="cs-objectives-title">Key objectives</h2>
                </div>
                <ul className="cs-overview-objectives">
                  {detail.overview.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </header>

        {!isCaseStudy && (
          <div className="cs-project-brief">
            <figure className="cs-hero-product cs-reveal">
              <ZoomableFigure
                src={detail.hero.src}
                alt={detail.hero.alt}
                caption={detail.hero.caption}
                plate={detail.hero.plate}
              />
              {detail.hero.caption && <figcaption>{detail.hero.caption}</figcaption>}
            </figure>

            {detail.stack.length > 0 && (
              <div className="cs-hero-stack cs-reveal" aria-label="Methods and tools">
                {detail.stack.map((item) => (
                  <span className="cs-tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="cs-sections">
          {detail.sections.map((section, sectionIndex) => {
            const beats = resolveSectionBeats(detail.slug, section)

            return (
              <section
                key={section.id}
                className="cs-section"
                id={`cs-${section.id}`}
                data-cs-section={section.id}
                data-cs-index={pad(sectionIndex + 1)}
                data-cs-label={section.label}
              >
                <div className="cs-section-marker cs-reveal">
                  <span className="cs-section-marker-num">
                    {pad(sectionIndex + 1)}
                  </span>
                  <span className="cs-section-marker-label">
                    {section.label.toLocaleLowerCase('en')}
                  </span>
                  <span className="cs-section-marker-rule" aria-hidden>
                    <span className="cs-section-marker-fill" />
                  </span>
                </div>

                <div className="cs-section-head cs-reveal">
                  <h2 className="cs-headline">{section.lead}</h2>
                </div>

                <div className="cs-section-body">
                  {beats.map((beat) => (
                    <section
                      className="cs-beat"
                      data-beat={beat.id}
                      data-layout={beat.layout}
                      data-tone={beat.tone ?? 'plain'}
                      data-media-width={beat.mediaWidth ?? 'full'}
                      key={beat.id}
                    >
                      <div className="cs-beat-context">
                        {beat.heading && (
                          <h3 className="cs-beat-heading">{beat.heading}</h3>
                        )}
                        <p className="cs-beat-intro">{beat.intro}</p>
                      </div>
                      <div className="cs-beat-blocks">
                        {(beat.interaction === 'comparison' || (!section.cmsBeats && beat.id === 'signal-comparison')) ? (
                          <EvidenceComparison>
                            {beat.blocks.map((block, index) => <BlockRenderer key={index} block={block} />)}
                          </EvidenceComparison>
                        ) : beat.blocks.map((block, blockIndex) => (
                          <div
                            className="cs-beat-block"
                            data-block-type={block.type}
                            key={`${beat.id}-${blockIndex}`}
                          >
                            {block.type === 'gallery' && (beat.walkthroughs || (!section.cmsBeats && walkthroughs[beat.id])) ? (
                              <StoryGallery labels={block.entries.map((entry) => entry.label)} descriptions={beat.walkthroughs ?? walkthroughs[beat.id]}>
                                {block.entries.map((entry) => (
                                  <figure className="cs-story-figure" key={entry.src}>
                                    <ZoomableFigure src={entry.src} alt={entry.alt} caption={entry.label} plate />
                                    <figcaption>{entry.label}</figcaption>
                                  </figure>
                                ))}
                              </StoryGallery>
                            ) : block.type === 'table' && (beat.interaction === 'experiment' || (!section.cmsBeats && beat.id === 'twelve-runs')) ? (
                              <ExperimentExplorer table={block}><BlockRenderer block={block} /></ExperimentExplorer>
                            ) : <BlockRenderer block={block} />}
                          </div>
                        ))}
                      </div>
                      {beat.takeaway && (
                        <p className="cs-beat-takeaway">{beat.takeaway}</p>
                      )}
                    </section>
                  ))}
                </div>
              </section>
            )
          })}

          <footer className="cs-footer">
            <p className="cs-footer-note">End of case study · {detail.title}</p>
            <div className="cs-footer-actions">
              <TransitionLink href="/works" className="cs-btn cs-btn-primary">
                <svg
                  className="cs-back-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M19 12H5" />
                  <path d="m11 6-6 6 6 6" />
                </svg>
                Back to all works
              </TransitionLink>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-btn"
                >
                  Source
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cs-btn"
                >
                  Live demo
                </a>
              )}
              <button type="button" className="cs-btn" data-cs-top>
                Back to top
              </button>
            </div>
            <FooterWorkCarousel currentSlug={project.slug} />
          </footer>
        </div>

        <div
          className="cs-lightbox"
          data-cs-lightbox
          role="dialog"
          aria-modal="true"
          aria-label="Project figure preview"
          hidden
        >
          <button type="button" className="cs-lightbox-close" aria-label="Close">
            ×
          </button>
          <figure>
            <div className="cs-lightbox-stage">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" data-cs-lightbox-img />
            </div>
            <figcaption data-cs-lightbox-caption />
          </figure>
        </div>
      </article>
    </CaseStudyScroll>
  )
}

export function CaseStudy({
  cs,
  project,
}: {
  cs: CaseStudyType
  project: Project
}) {
  return <WorkDetail detail={cs} project={project} />
}

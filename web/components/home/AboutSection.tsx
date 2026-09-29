import Image from '@/components/cms/ContentImage'

import { Cascade } from '@/components/motion/Cascade'
import { Reveal } from '@/components/motion/Reveal'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Crumb } from '@/components/ui/SectionCrumb'
import { SectionMarker } from '@/components/ui/SectionMarker'
import { ToolGlyph, hasGlyph } from '@/components/icons/tools'
import { cssUrl } from '@/lib/css'
import { sizeOf } from '@/content/image-sizes'
import {
  getCertifications,
  getEducation,
  getExperience,
  getProfile,
  getSkills,
  getToolGroups,
} from '@/lib/content'
import styles from '@/app/(site)/about/about.module.css'

/**
 * "Feb 2023 – Jul 2026 · 3 yrs 6 mos" is one string in the content, and one
 * line of it would claim 180px of every row. Split at the interpunct and the
 * date column narrows to the range alone.
 */
function splitWhen(value: string): [string, string?] {
  const [range, ...rest] = value.split(' · ')
  return rest.length > 0 ? [range, rest.join(' · ')] : [range]
}

export async function AboutSection({only,embedded=false}:{only?:string[];embedded?:boolean}={}) {
  const [profile, experience, education, skills, toolGroups, certifications] =
    await Promise.all([
      getProfile(),
      getExperience(),
      getEducation(),
      getSkills(),
      getToolGroups(),
      getCertifications(),
    ])
  const hasSkills = (!only || only.includes('skills')) && (skills.length > 0 || toolGroups.length > 0)
  const photo = sizeOf(profile.photo)

  // Whatever actually renders, in scroll order. The sticky header trails
  // it, and the chapter numerals count off the same list.
  const sections: Crumb[] = [
    (!only || only.includes('experience')) && experience.length > 0 && { id: 'experience', label: 'Experience' },
    (!only || only.includes('education')) && education.length > 0 && { id: 'education', label: 'Education' },
    hasSkills && { id: 'skills', label: 'Skills & Tools' },
    (!only || only.includes('certifications')) && certifications.length > 0 && { id: 'certifications', label: 'Certifications' },
  ].filter(Boolean) as Crumb[]

  const num = (id: string) =>
    String(sections.findIndex((s) => s.id === id) + 1).padStart(2, '0')

  return (
    <div className={styles.page}>
      {!embedded&&<PageHeader
        first
        as="h1"
        label="About"
        sections={sections}
        actions={
          <a
            href={profile.cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cv}
          >
            Download CV ↗
          </a>
        }
      />}

      <div className={styles.root}>
        {(!only||only.includes('profile')) && <Cascade className={styles.hero} index={1}>
          <div className={styles.heroMain}>
            <div className={styles.photo}>
              <Image
                src={profile.photo}
                alt={profile.fullName}
                width={photo.width}
                height={photo.height}
                sizes="132px"
              />
            </div>
            <div className={styles.titleBlock}>
              <p className={`${styles.name} display`}>{profile.fullName}</p>
              <p className={styles.role}>{profile.roleTitle}</p>
            </div>
            <p className={styles.bio}>{profile.bio}</p>
          </div>
        </Cascade>}

        {(!only || only.includes('experience')) && experience.length > 0 && (
          <section className={styles.section}>
            <SectionMarker
              id="experience"
              num={num('experience')}
              label="Experience"
            />
            <ol className={styles.ledger}>
              {experience.map((entry, index) => {
                const [range, duration] = splitWhen(entry.dateRange)
                return (
                  <Reveal
                    as="li"
                    className={styles.entry}
                    index={index}
                    key={entry.role + entry.company}
                  >
                    <div className={styles.entryBody}>
                      <h3 className={styles.title}>{entry.role}</h3>
                      <p className={styles.org}>{entry.company}</p>
                      <p className={styles.desc}>{entry.description}</p>
                      <div className={styles.tags}>
                        {entry.tags.map((tag) => (
                          <span className={styles.tag} key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.when}>
                      <span>{range}</span>
                      {duration && (
                        <span className={styles.duration}>{duration}</span>
                      )}
                    </div>
                  </Reveal>
                )
              })}
            </ol>
          </section>
        )}

        {(!only || only.includes('education')) && education.length > 0 && (
          <section className={styles.section}>
            <SectionMarker
              id="education"
              num={num('education')}
              label="Education"
            />
            <ol className={styles.ledger}>
              {education.map((entry, index) => {
                const [range, duration] = splitWhen(entry.dateRange)
                return (
                  <Reveal
                    as="li"
                    className={styles.entry}
                    index={index}
                    key={entry.institution}
                  >
                    <div className={styles.entryBody}>
                      <h3 className={styles.title}>{entry.degree}</h3>
                      <p className={styles.org}>{entry.institution}</p>
                      {entry.details && (
                        <p className={styles.desc}>{entry.details}</p>
                      )}
                    </div>
                    <div className={styles.when}>
                      <span>{range}</span>
                      {duration && (
                        <span className={styles.duration}>{duration}</span>
                      )}
                      {entry.grade && (
                        <span className={styles.grade}>GPA {entry.grade}</span>
                      )}
                    </div>
                  </Reveal>
                )
              })}
            </ol>
          </section>
        )}

        {hasSkills && (
          <section className={styles.section}>
            <SectionMarker
              id="skills"
              num={num('skills')}
              label="Skills & Tools"
            />

            {/* The practices first, as an open field. If these were boxed
                too they would compete with the tools container and neither
                would read as the primary thing. */}
            {skills.length > 0 && (
              <Reveal>
                <div className={styles.skills}>
                  {skills.map((skill) => (
                    <span className={styles.tag} key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </Reveal>
            )}

            {/* One container, one row per category. The groups run nine
                tools against one, so equal grid cells would leave a cell
                holding a single chip beside one holding nine. Full-width
                rows turn that count into information instead of a hole. */}
            {toolGroups.length > 0 && (
              <Reveal>
                <dl className={styles.tools}>
                  {toolGroups.map((group) => (
                    <div className={styles.toolRow} key={group.label}>
                      <dt className={styles.toolLabel}>{group.label}</dt>
                      <dd className={styles.toolChips}>
                        {group.tools.map((tool) => (
                          <span
                            className={styles.tool}
                            data-glyph={
                              hasGlyph(tool.icon) || tool.logo
                                ? true
                                : undefined
                            }
                            key={tool.name}
                          >
                            {hasGlyph(tool.icon) ? (
                              <ToolGlyph
                                icon={tool.icon}
                                className={styles.toolGlyph}
                              />
                            ) : (
                              tool.logo && (
                                /* A mask, not an <img>: the file is painted
                                   in currentColor, so a white source works
                                   on the wash and both themes are free. */
                                <span
                                  aria-hidden
                                  className={styles.toolLogo}
                                  style={{
                                    maskImage: cssUrl(tool.logo),
                                    WebkitMaskImage: cssUrl(tool.logo),
                                  }}
                                />
                              )
                            )}
                            {tool.name}
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            )}
          </section>
        )}

        {(!only || only.includes('certifications')) && certifications.length > 0 && (
          <section className={styles.section}>
            <SectionMarker
              id="certifications"
              num={num('certifications')}
              label="Certifications"
            />
            {/* One plate, not three stacked rows: the entries are short
                enough that hairline cells say it in a third of the height.
                The reveal sits on the plate, because fading the cells
                individually would show the plate's own border fill through
                them. */}
            <Reveal>
              <ol className={styles.plate}>
                {certifications.map((entry) => (
                  <li className={styles.cert} key={entry.name}>
                    <h3 className={styles.certName}>{entry.name}</h3>
                    <p className={styles.certIssuer}>{entry.issuer}</p>
                    {entry.skills.length > 0 && (
                      <div className={styles.tags}>
                        {entry.skills.map((skill) => (
                          <span className={styles.tag} key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={styles.certMeta}>
                      <span>{entry.issued}</span>
                      {entry.credentialId && (
                        <span>ID {entry.credentialId}</span>
                      )}
                    </div>
                    {entry.credentialUrl && (
                      <a
                        href={entry.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.credential}
                      >
                        Show credential ↗
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </Reveal>
          </section>
        )}
      </div>
    </div>
  )
}

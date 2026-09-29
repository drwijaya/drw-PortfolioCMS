import { AnalyticsStamp } from '@/components/cms/AnalyticsStamp'
import { ExtraNavigation } from '@/components/cms/ExtraNavigation'
import Image from '@/components/cms/ContentImage'

import { TransitionLink } from '@/components/navigation/RouteTransition'
import { NavPill } from './NavPill'
import { PrimaryNav } from './PrimaryNav'
import { MENU, ROMAN } from './nav-items'
import { SidebarEntrance } from './SidebarEntrance'
import { ThemeToggle } from './ThemeToggle'
import { getProfile } from '@/lib/content'
import styles from './Sidebar.module.css'


export async function Sidebar() {
  const profile = await getProfile()

  // The numeral sequence runs unbroken across both groups, the way a
  // printed index would.
  const connect = profile.socialLinks ?? [
    { href: profile.linkedinUrl, label: 'LinkedIn' },
    { href: profile.githubUrl, label: 'GitHub' },
    { href: profile.instagramUrl, label: 'Instagram' },
    { href: `mailto:${profile.email}`, label: 'Email' },
  ]

  return (
    /* id/tabIndex are the drawer contract: <MobileDock /> moves focus here
       when it opens and needs something to aim at. */
    <aside id="dock-panel" tabIndex={-1} className={styles.sidebar}>
      <SidebarEntrance variant="site">
      <div className={styles.art} aria-hidden>
        <Image
          src={profile.sidebarPhoto??"/sidebar-portrait.png"}
          alt=""
          fill
          sizes="(max-width: 679px) 100vw, (max-width: 1279px) 216px, 248px"
          className={styles.artImg}
        />
      </div>

      <div className={styles.top}>
        <ThemeToggle />
      </div>

      {/* Everything except the theme toggle is anchored to the foot of the
          column. The gap sits under the toggle, not between the identity
          and the controls. */}
      <div className={styles.bottom}>
        <TransitionLink href="/works" className={`${styles.name} display`}>
          {profile.fullName}
        </TransitionLink>

        <p className={styles.bio}>{profile.shortBio}</p>

        {/* A rule, not a label. The "Connect to" heading is gone. */}
        <hr className={`${styles.rule} ${styles.identityRule}`} />

        {/* Hidden on a phone: the same four destinations are in the dock,
            where a thumb can reach them without opening anything. */}
        <PrimaryNav
          variant="column"
          className={`${styles.group} ${styles.primaryGroup}`}
        />

        <hr className={styles.rule} />

        <nav
          className={`${styles.group} ${styles.socialGroup}`}
          aria-label="Elsewhere"
        >
          {connect.map((item, i) => (
            <NavPill
              key={item.href}
              {...item}
              numeral={ROMAN[MENU.length + i]}
              external
            />
          ))}
        </nav>

        <ExtraNavigation/>
        <div className={styles.foot}>
          <TransitionLink href="/works" className={styles.mark} aria-label={profile.fullName}>
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
          {/* The second toggle. On a phone the top strip is gone — the
              header up there carries the wordmark and nothing else — so the
              control comes to rest beside the stamp instead. Exactly one of
              the two is ever displayed, and `display: none` keeps the other
              out of the accessibility tree rather than duplicating it. */}
          <span className={styles.footToggle}>
            <ThemeToggle />
          </span>
        </div>
      </div>
      </SidebarEntrance>
    </aside>
  )
}

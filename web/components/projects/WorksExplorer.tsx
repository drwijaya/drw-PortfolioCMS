'use client'

import { useState } from 'react'

import { Cascade } from '@/components/motion/Cascade'
import { TransitionLink } from '@/components/navigation/RouteTransition'
import { PageHeader } from '@/components/ui/PageHeader'
import { ViewToggle, type View } from '@/components/ui/ViewToggle'
import type { PlaygroundItem, Project } from '@/lib/types'

import { PlaygroundSection } from './PlaygroundSection'
import { ProjectsView } from './ProjectsView'
import styles from './Projects.module.css'

export function WorksExplorer({
  projects,
  playground,
}: {
  projects: Project[]
  playground: PlaygroundItem[]
}) {
  const [view, setView] = useState<View>('grid')
  const [hasChangedView, setHasChangedView] = useState(false)
  const canSwitchView = projects.length >= 4

  const changeView = (nextView: View) => {
    setHasChangedView(true)
    setView(nextView)
  }

  return (
    <>
      <PageHeader
        first
        as="h1"
        label="Selected work"
        actions={
          <>
            <span
              style={{
                fontSize: 'var(--step--1)',
                color: 'var(--text-secondary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
            {canSwitchView && <ViewToggle value={view} onChange={changeView} />}
          </>
        }
      />


      {projects.length > 0 ? (
        <ProjectsView
          projects={projects}
          view={view}
          animateEntrance={!hasChangedView}
        />
      ) : (
        <Cascade index={1}>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '42ch' }}>
            No published projects yet. Please check back soon.
          </p>
        </Cascade>
      )}

      {playground.length > 0 && (
        <>
          <PageHeader
            label="My recent playground"
            actions={
              <TransitionLink href="/playground" className={styles.playgroundAllLink}>
                See all playground <span aria-hidden>→</span>
              </TransitionLink>
            }
          />
          <PlaygroundSection items={playground} view={view} animateEntrance={!hasChangedView} />
        </>
      )}
    </>
  )
}

'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** All figures and captions are rendered on the server. Enhancement pairs
 * the current explanation with its figure, without taking over scrolling. */
export function StoryGallery({
  children, labels, descriptions,
}: {
  children: ReactNode[]
  labels: string[]
  descriptions: string[]
}) {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [enhanced, setEnhanced] = useState(false)

  useEffect(() => {
    const element = root.current
    const stage = element?.querySelector<HTMLElement>('.cs-story-stage')
    if (!element || !stage || !enhanced) return
    // Keep the full figure pinned until the end of the final explanation
    // passes the reading line. Size this runway from the actual stage, rather
    // than adding a viewport of blank space to every step.
    const measure = () => {
      const style = getComputedStyle(stage)
      const top = parseFloat(style.top) || 0
      const runway = style.position === 'sticky'
        ? Math.max(0, top + stage.offsetHeight - readingLine(element) + 32)
        : 0
      element.style.setProperty('--story-end-runway', `${Math.ceil(runway)}px`)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      element.style.removeProperty('--story-end-runway')
    }
  }, [enhanced])

  function readingLine(element: HTMLDivElement) {
    const stage = element.querySelector<HTMLElement>('.cs-story-stage')
    // On a stacked layout the reading line sits below the sticky figure.
    if (stage && stage.offsetWidth > element.offsetWidth * 0.8) {
      const stickyTop = parseFloat(getComputedStyle(stage).top)
      if (getComputedStyle(stage).position === 'sticky' && Number.isFinite(stickyTop)) {
        return Math.min(window.innerHeight * 0.72, stickyTop + stage.offsetHeight + 48)
      }
    }
    return window.innerHeight * 0.43
  }

  useEffect(() => {
    const element = root.current
    if (!element) return
    const steps = Array.from(element.querySelectorAll<HTMLElement>('[data-story-step]'))
    let frame = 0
    let visible = false
    const update = () => {
      frame = 0
      if (!visible) return
      const line = readingLine(element)
      let next = 0
      steps.forEach((step, index) => {
        if (step.getBoundingClientRect().top <= line) next = index
      })
      setActive(next)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
    })
    observer.observe(element)
    const setup = requestAnimationFrame(() => setEnhanced(true))
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(setup)
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  function select(index: number) {
    setActive(index)
    const step = root.current?.querySelectorAll<HTMLElement>('[data-story-step]')[index]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (step && root.current) {
      window.scrollTo({
        top: window.scrollY + step.getBoundingClientRect().top - readingLine(root.current) + 20,
        behavior: reduced ? 'instant' : 'smooth',
      })
    }
  }

  return (
    <div ref={root} className="cs-story-gallery" data-enhanced={enhanced || undefined}>
      <div className="cs-story-stage">
        <div className="cs-story-counter" aria-hidden="true">
          <span>Inside the system</span>
          <span>{String(active + 1).padStart(2, '0')} / {String(labels.length).padStart(2, '0')}</span>
        </div>
        {children.map((child, index) => (
          <div className="cs-story-panel" key={index} hidden={enhanced && index !== active}>
            {child}
          </div>
        ))}
        <p className="cs-story-hint">Scroll through the workflow · Select a step to revisit it</p>
      </div>
      <ol className="cs-story-steps" aria-label="Workflow walkthrough">
        {labels.map((label, index) => (
          <li key={label} data-story-step data-active={index === active || undefined}>
            <button type="button" onClick={() => select(index)} aria-current={index === active ? 'step' : undefined}>
              <span className="cs-story-step-number">{String(index + 1).padStart(2, '0')}</span>
              <span>{label}</span>
            </button>
            <p>{descriptions[index]}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

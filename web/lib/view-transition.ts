import type { CSSProperties } from 'react'

export function projectTransitionNames(slug: string) {
  return {
    image: `project-${slug}-image`,
    title: `project-${slug}-title`,
  }
}

/**
 * Props that give an element a view-transition-name.
 *
 * The name is dynamic, so it cannot live in a stylesheet, but setting
 * `view-transition-name` inline puts it out of reach of the cascade: the
 * only way to cancel it is an attribute-substring match plus `!important`.
 * Routing it through a custom property on the shared `.vt` class (see
 * globals.css) keeps the value dynamic and the property overridable, which
 * is what lets a directional route change hand every name back with an
 * ordinary rule.
 */
export function vt(name: string, className?: string) {
  return {
    className: className ? `${className} vt` : 'vt',
    style: { '--vt-name': name } as CSSProperties,
  }
}

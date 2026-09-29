import type { WorkPresentationType } from '@/lib/types'

const LABELS: Record<WorkPresentationType, string> = {
  'case-study': 'Case Study',
  project: 'Project',
  'design-portfolio': 'Design Portfolio',
  playground: 'Playground',
}

const CTAS: Record<WorkPresentationType, string> = {
  'case-study': 'Read case study',
  project: 'View project',
  'design-portfolio': 'View portfolio',
  playground: 'Open experiment',
}

export function workTypeLabel(type: WorkPresentationType): string {
  return LABELS[type]
}

export function workTypeCta(type: WorkPresentationType): string {
  return CTAS[type]
}

'use client'

import { useState, type ReactNode } from 'react'

export function EvidenceComparison({ children }: { children: ReactNode[] }) {
  const [view, setView] = useState('both')
  return (
    <div className="cs-evidence-comparison" data-view={view}>
      <div className="cs-comparison-controls" role="group" aria-label="Compare signal traces">
        {[['both', 'Compare both'], ['strong', 'Strong reflection'], ['weak', 'Weak reflection']].map(([value, label]) => (
          <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>
        ))}
      </div>
      <div className="cs-comparison-panels">
        {children.map((child, index) => (
          <div key={index} hidden={view !== 'both' && view !== (index === 0 ? 'strong' : 'weak')}>
            <p className="cs-comparison-label">{index === 0 ? '01 / Strong reflection' : '02 / Weak reflection'}</p>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

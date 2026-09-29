'use client'

import { useState, type ReactNode } from 'react'
import type { TableBlock } from '@/lib/types'

/** Uses the same source rows as the full table; no fitted/interpolated data. */
export function ExperimentExplorer({ table, children }: { table: TableBlock; children: ReactNode }) {
  const [selected, setSelected] = useState(2)
  const row = table.rows[selected]
  const plain = (value: string) => value.replace(/<[^>]*>/g, '')
  const detection = parseFloat(plain(row[2]))
  const snr = parseFloat(plain(row[4]))

  return (
    <div className="cs-experiment">
      <div className="cs-experiment-controls" role="group" aria-label="Choose a tested sensor placement">
        <p className="cs-interactive-kicker">Explore the four tested placements</p>
        <p>Choose a distance and angle to compare counting reliability with signal quality.</p>
        <div className="cs-treatment-options">
          {table.rows.map((treatment, index) => (
            <button key={index} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>
              <span className="cs-placement-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="cs-placement-pair">{treatment[0]} <span>at {treatment[1]}</span></span>
              <small>{index === 2 ? 'Recommended pair' : 'Tested placement'}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="cs-experiment-result" aria-live="polite" aria-atomic="true">
        <p className="cs-interactive-kicker">{row[0]} at {row[1]} · Mean of 3 replications</p>
        <div className="cs-response">
          <div><span>Detection rate</span><strong>{plain(row[2])}</strong></div>
          <div className="cs-response-track" aria-hidden="true"><span style={{ transform: `scaleX(${detection / 100})` }} /></div>
          <p>0–100% · Standard deviation {plain(row[3])}</p>
        </div>
        <div className="cs-response">
          <div><span>Signal-to-noise ratio</span><strong>{plain(row[4])}</strong></div>
          <div className="cs-response-track" aria-hidden="true"><span style={{ transform: `scaleX(${snr / 30})` }} /></div>
          <p>0–30 dB · Standard deviation {plain(row[5])}</p>
        </div>
        <p className="cs-experiment-verdict">
          {selected === 2
            ? 'The selected pair has the smallest detection-rate spread. Combined desirability, rather than the highest single response, determined the recommendation.'
            : selected === 0
              ? 'The highest mean detection rate. However, detection-rate differences did not reach statistical significance across the four placements.'
              : selected === 1
                ? 'The strongest signal, but the lowest mean detection rate and the widest detection-rate spread. A stronger signal did not guarantee more reliable counting.'
                : 'A similar mean detection rate with the lowest mean signal-to-noise ratio. Distance and angle need to be specified together.'}
        </p>
      </div>
      <div className="cs-experiment-data">
        <p className="cs-interactive-kicker">The complete experimental record</p>
        {children}
      </div>
    </div>
  )
}

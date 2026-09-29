// ─────────────────────────────────────────────────────────────────────────
// The 15-type switch. TypeScript makes it exhaustive: adding a block type
// to lib/types.ts is a compile error here until it is handled.
//
// Every branch reproduces the DOM that partials/case_study.html emitted,
// class name for class name, so the 1,191 lines of case-study.css keep
// working untouched.
// ─────────────────────────────────────────────────────────────────────────

import { CountUp } from './CountUp'
import { ZoomableFigure } from './ZoomableFigure'
import type { Block } from '@/lib/types'
import { clean } from '@/lib/sanitize'

/**
 * Case-study emphasis belongs to headings and layout, not inline body weight.
 * Keep the source copy intact while removing legacy visual emphasis tags at
 * the rendering boundary.
 */
const regularContent = (html: string) =>
  clean(html).replace(/<\/?(?:strong|b)>/gi, '')

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    // ── prose ────────────────────────────────────────────────────────
    case 'lead':
      return (
        <p
          className="cs-lead cs-reveal"
          dangerouslySetInnerHTML={{ __html: regularContent(block.html) }}
        />
      )

    case 'text':
      return (
        <p
          className="cs-text cs-reveal"
          dangerouslySetInnerHTML={{ __html: regularContent(block.html) }}
        />
      )

    // ── media ────────────────────────────────────────────────────────
    case 'figure':
      return (
        <figure className={`cs-figure cs-reveal${block.wide ? ' is-wide' : ''}`}>
          <ZoomableFigure
            src={block.src}
            alt={block.alt}
            caption={block.caption}
            plate={block.plate}
          />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )

    case 'gallery':
      return (
        <div className="cs-gallery cs-reveal">
          {block.entries.map((g) => (
            <figure className={`cs-gallery-item${g.span === 'three' ? ' is-three-grid' : ''}`} key={g.src}>
              <ZoomableFigure src={g.src} alt={g.alt} caption={g.label} plate />
              <figcaption>{g.label}</figcaption>
            </figure>
          ))}
        </div>
      )

    // ── numbers ──────────────────────────────────────────────────────
    case 'stats':
      return (
        <div className="cs-stats cs-reveal">
          {block.entries.map((s, i) => (
            <div
              key={i}
              className={`cs-stat${s.tone === 'bad' ? ' is-bad' : ''}${
                s.tone === 'good' ? ' is-good' : ''
              }`}
            >
              {/^-?\d+(?:\.\d+)?(?:%| min)?$/.test(s.value)
                ? <CountUp className="cs-stat-value" count={parseFloat(s.value)} decimals={s.value.match(/\.(\d+)/)?.[1].length ?? 0} suffix={s.value.replace(/^-?\d+(?:\.\d+)?/, '')} />
                : <span className="cs-stat-value">{s.value}</span>}
              <span className="cs-stat-label">{s.label}</span>
              {s.note && <span className="cs-stat-note">{s.note}</span>}
            </div>
          ))}
        </div>
      )

    case 'metrics':
      return (
        <div className="cs-metrics cs-reveal">
          {block.entries.map((m, i) => (
            <div
              key={i}
              className={`cs-metric${m.tone === 'good' ? ' is-good' : ''}`}
            >
              <CountUp
                className="cs-metric-value"
                count={m.count}
                decimals={m.decimals}
                prefix={m.prefix}
                suffix={m.suffix}
              />
              <span className="cs-metric-label">{m.label}</span>
              {m.sub && <span className="cs-metric-sub">{m.sub}</span>}
            </div>
          ))}
        </div>
      )

    // ── editorial ────────────────────────────────────────────────────
    case 'quote':
      return (
        <blockquote className="cs-quote cs-reveal">
          <p>{block.text}</p>
          {block.cite && <cite>{block.cite}</cite>}
        </blockquote>
      )

    case 'callout':
      return (
        /* Every callout title on this site already names its own kind —
           "Evidence limit", "Design rule", "Project credits". The 32px
           glyph square beside them was a second, vaguer version of the
           same word, so the aside keeps the anchor it actually needed:
           a rule down its left edge. */
        <aside className="cs-callout cs-reveal">
          <div className="cs-callout-body">
            <h3>{block.title}</h3>
            <p dangerouslySetInnerHTML={{ __html: regularContent(block.body) }} />
          </div>
        </aside>
      )

    case 'list': {
      const variant = block.variant ?? 'plain'
      const items = block.entries.map((it, i) => (
        <li key={i}>
          <span className="cs-list-title">{it.title}</span>
          {it.body && (
            <span
              className="cs-list-body"
              dangerouslySetInnerHTML={{ __html: regularContent(it.body) }}
            />
          )}
        </li>
      ))
      const className = `cs-list cs-reveal cs-list-${variant}`
      return variant === 'numbered' ? (
        <ol className={className}>{items}</ol>
      ) : (
        <ul className={className}>{items}</ul>
      )
    }

    case 'cards':
      return (
        <div className="cs-cards cs-reveal" data-cols={block.cols}>
          {block.entries.map((c, i) => (
            <div className="cs-card" key={i}>
              <div className="cs-card-heading">
                {c.num && <span className="cs-card-num">{c.num}</span>}
                <h3 className="cs-card-title">{c.title}</h3>
              </div>
              <p
                className="cs-card-body"
                dangerouslySetInnerHTML={{ __html: regularContent(c.body) }}
              />
            </div>
          ))}
        </div>
      )

    // ── structured ───────────────────────────────────────────────────
    case 'table':
      return (
        <>
          <div
            className="cs-table-wrap cs-reveal"
            role="region"
            aria-label={`Scrollable data table: ${block.head.join(', ')}`}
            tabIndex={0}
          >
            <table className={`cs-table${block.compact ? ' is-compact' : ''}`}>
              <thead>
                <tr>
                  {block.head.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        dangerouslySetInnerHTML={{ __html: regularContent(cell) }}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
              {block.foot && (
                <tfoot>
                  <tr>
                    {block.foot.map((cell, i) => (
                      <td
                        key={i}
                        dangerouslySetInnerHTML={{ __html: regularContent(cell) }}
                      />
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {block.note && <p className="cs-table-note cs-reveal">{block.note}</p>}
        </>
      )

    case 'pipeline':
      return (
        <div className="cs-pipeline cs-reveal">
          {block.entries.map((p, i) => (
            <span key={p.n} style={{ display: 'contents' }}>
              <div className={`cs-pipe-node${p.final ? ' is-final' : ''}`}>
                <span className="cs-pipe-num">{p.n}</span>
                <span className="cs-pipe-label">{p.label}</span>
                {p.sub && <span className="cs-pipe-sub">{p.sub}</span>}
              </div>
              {i < block.entries.length - 1 && (
                <span className="cs-pipe-arrow" aria-hidden />
              )}
            </span>
          ))}
        </div>
      )

    case 'compare':
      return (
        <div className="cs-compare cs-reveal">
          <div className="cs-compare-head">
            <span>Before</span>
            <span />
            <span>After</span>
          </div>
          {block.entries.map(([before, after], i) => (
            <div className="cs-compare-row" key={i}>
              <span className="cs-compare-before">{before}</span>
              <span className="cs-compare-arrow" aria-hidden />
              <span className="cs-compare-after">{after}</span>
            </div>
          ))}
        </div>
      )

    case 'personas':
      return (
        <div className="cs-personas cs-reveal">
          {block.entries.map((p) => (
            <article className="cs-persona" key={p.name}>
              <header className="cs-persona-head">
                <div className="cs-persona-avatar">{p.name[0]}</div>
                <div>
                  <h3>
                    {p.name}
                    <span className="cs-persona-age">, {p.age}</span>
                  </h3>
                  <span className="cs-persona-role">{p.role}</span>
                  <span className="cs-persona-exp">{p.exp}</span>
                </div>
              </header>

              <p className="cs-persona-summary">{p.summary}</p>

              <div className="cs-persona-cols">
                <div>
                  <span className="cs-persona-label">Goals</span>
                  <ul>
                    {p.goals.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="cs-persona-label cs-persona-label-pain">
                    Pain points
                  </span>
                  <ul>
                    {(p.pains ?? []).map((pn, i) => (
                      <li key={i}>{pn}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {p.hmw && (
                <div className="cs-persona-hmw">
                  <span>How might we</span>
                  <p>{p.hmw}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )

    case 'tags':
      return (
        <div className="cs-tags cs-reveal">
          {block.entries.map((t) => (
            <span className="cs-tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      )
  }
}

// 报刊词频: slogans and keywords followed through 人民日报, one row each, one cell per year. Two readings: the
// yearly article counts from a searchable archive, or the rate per 10 000 characters in the editorial sample.
// Rows are shaded against their own peak and sorted by the year they first appear, so the succession of
// slogans reads from top to bottom.
import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import { NOW } from '../../lib/faction'
import { conceptHref, go } from '../../lib/router'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { Src, useTip } from '../bits'

const FIRST = 2000
const ROW = 24
const LABEL = 128
const TAIL = 64

export function Press({ onPick }: { onPick: (id: string | null) => void }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const hasHits = a.db.press.some((t) => t.hits.length)
  const hasSample = a.db.corpus.some((d) => d.kind === 'editorial')
  const [mode, setMode] = useState<'hits' | 'sample'>(hasHits ? 'hits' : 'sample')
  const years = d3.range(FIRST, Math.floor(NOW) + 1)

  const rows = useMemo(() => {
    const sample = d3.rollup(
      a.db.corpus.filter((d) => d.kind === 'editorial'),
      (ds) => ({ chars: d3.sum(ds, (d) => d.chars), n: (id: string) => d3.sum(ds, (d) => d.press?.[id] ?? 0) }),
      (d) => Number(d.date.slice(0, 4)),
    )
    return a.db.press
      .map((t) => {
        const val = new Map<number, number>()
        if (mode === 'hits') for (const h of t.hits) val.set(h.year, h.n)
        else
          for (const [y, b] of sample)
            if (b.chars) val.set(y, (b.n(t.id) * 10000) / b.chars)
        const max = d3.max(val.values()) ?? 0
        const first = years.find((y) => (val.get(y) ?? 0) > 0)
        const peak = years.reduce((b, y) => ((val.get(y) ?? 0) > (val.get(b) ?? 0) ? y : b), years[0])
        return { t, val, max, first, peak, total: d3.sum(val.values()) }
      })
      .filter((r) => r.max > 0)
      .sort((p, q) => (p.first ?? 9999) - (q.first ?? 9999) || p.peak - q.peak)
  }, [a, mode, years])

  if (!a.db.press.length) return <div className="empty">报刊词频尚在整理</div>
  const W = Math.max(width, 620)
  const cw = (W - LABEL - TAIL) / years.length
  const H = rows.length * ROW + 30
  const color = d3.interpolate('#f3e8c9', '#a3201c')
  const cite = a.db.press.find((t) => t.cite)?.cite

  return (
    <div className="card pad press-v" ref={ref}>
      {hasHits && hasSample && (
        <div className="seg" style={{ marginBottom: 10 }}>
          <button className={mode === 'hits' ? 'on' : undefined} onClick={() => setMode('hits')}>
            全报检索命中
          </button>
          <button className={mode === 'sample' ? 'on' : undefined} onClick={() => setMode('sample')}>
            社论样本（每万字）
          </button>
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 620, display: 'block' }} role="img" aria-label="人民日报词频">
          {years.map((y, j) =>
            y % 5 === 0 || j === years.length - 1 ? (
              <text key={y} x={LABEL + j * cw + cw / 2} y={14} textAnchor="middle" className="cw-tick">
                {y}
              </text>
            ) : null,
          )}
          {rows.map((r, i) => {
            const y0 = 24 + i * ROW
            const link = r.t.concept ? conceptHref(r.t.concept) : undefined
            return (
              <g key={r.t.id}>
                <text
                  x={LABEL - 8}
                  y={y0 + ROW / 2 + 4}
                  textAnchor="end"
                  className={`pr-name${link || r.t.ism ? ' link' : ''}`}
                  onClick={() => (link ? go(link) : r.t.ism && onPick(r.t.ism))}
                >
                  {r.t.name}
                </text>
                {years.map((y, j) => {
                  const v = r.val.get(y) ?? 0
                  return (
                    <rect
                      key={y}
                      x={LABEL + j * cw + 1}
                      y={y0 + 2}
                      width={cw - 2}
                      height={ROW - 4}
                      rx={3}
                      fill={v ? color(Math.sqrt(v / r.max)) : 'var(--paper-2)'}
                      opacity={v ? 1 : 0.5}
                      stroke={y === r.first ? 'var(--ink)' : 'none'}
                      strokeWidth={1.2}
                      onMouseMove={(e) => tip.show(e, <><b>{r.t.name}</b> · {y}<div>{mode === 'hits' ? `${v} 篇` : `每万字 ${v.toFixed(2)} 次`}</div>{y === r.peak && <div className="m">峰值年</div>}</>)}
                      onMouseLeave={tip.hide}
                    />
                  )
                })}
                <text x={W - TAIL + 8} y={y0 + ROW / 2 + 4} className="cw-tick">
                  峰 {r.peak}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="legend small">
        <span>每行按自身峰值着色；黑框＝首次出现</span>
        {mode === 'hits' && cite && (
          <span>
            检索来源 <Src cite={cite} />
          </span>
        )}
        {mode === 'sample' && <span className="muted">社论样本 {a.db.corpus.filter((d) => d.kind === 'editorial').length} 篇</span>}
      </div>
      {tip.node}
    </div>
  )
}

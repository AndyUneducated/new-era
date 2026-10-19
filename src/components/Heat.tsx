// Term frequency per 10 000 characters: concepts × corpus documents.
import type { CorpusR } from '../data/db'
import type { Concept } from '../data/schema'
import { go, conceptHref } from '../lib/router'
import { useTip } from './bits'

const CW = 30
const RH = 24
const LABEL = 150

export const per10k = (doc: CorpusR, id: string) => (doc.chars ? ((doc.counts[id] ?? 0) * 10000) / doc.chars : 0)

export function Heat({ concepts, docs }: { concepts: Concept[]; docs: CorpusR[] }) {
  const tip = useTip()
  const total = (c: Concept) => docs.reduce((n, d) => n + per10k(d, c.id), 0)
  const rows = concepts.filter((c) => docs.some((d) => d.counts[c.id])).sort((x, y) => total(y) - total(x))
  if (!rows.length || !docs.length) return <div className="empty">语料尚未载入</div>
  const max = Math.max(...rows.flatMap((c) => docs.map((d) => per10k(d, c.id))), 0.01)
  // square root so the long tail of rare terms stays visible; the mix follows the theme
  const color = (v: number) => `color-mix(in oklab, var(--red) ${Math.round(12 + 88 * Math.sqrt(v / max))}%, var(--card))`
  const W = LABEL + docs.length * CW + 10
  const H = 70 + rows.length * RH
  return (
    <div className="heat">
      <svg width={W} height={H}>
        {docs.map((d, j) => (
          <text key={d.id} transform={`translate(${LABEL + j * CW + CW / 2}, 62) rotate(-55)`} style={{ fontSize: 11 }}>
            {d.short}
          </text>
        ))}
        {rows.map((c, i) => (
          <g key={c.id} transform={`translate(0, ${70 + i * RH})`}>
            <text x={LABEL - 8} y={RH / 2 + 4} textAnchor="end" style={{ cursor: 'pointer', fontWeight: 600 }} onClick={() => go(conceptHref(c.id))}>
              {c.name.length > 11 ? `${c.name.slice(0, 10)}…` : c.name}
            </text>
            {docs.map((d, j) => {
              const v = per10k(d, c.id)
              return (
                <rect
                  key={d.id}
                  className="cell"
                  x={LABEL + j * CW + 1}
                  y={1}
                  width={CW - 2}
                  height={RH - 2}
                  rx={3}
                  fill={v ? color(v) : 'transparent'}
                  stroke={v ? 'none' : 'var(--rule)'}
                  onClick={() => go(conceptHref(c.id))}
                  onMouseMove={(e) => tip.show(e, <><b>{c.name}</b><div className="m">{d.title}</div><div>{d.counts[c.id] ?? 0} 次 · 每万字 {v.toFixed(1)}</div></>)}
                  onMouseLeave={tip.hide}
                />
              )
            })}
          </g>
        ))}
      </svg>
      {tip.node}
    </div>
  )
}

// one concept across the documents of one kind, as columns
export function Bars({ id, docs }: { id: string; docs: CorpusR[] }) {
  const tip = useTip()
  const vals = docs.map((d) => per10k(d, id))
  const max = Math.max(...vals, 0.01)
  const H = 120
  const bw = 34
  return (
    <div className="heat">
      <svg width={docs.length * bw + 10} height={H + 46}>
        {docs.map((d, j) => {
          const h = (vals[j] / max) * H
          return (
            <g key={d.id} onMouseMove={(e) => tip.show(e, <><b>{d.title}</b><div>{d.counts[id] ?? 0} 次 · 每万字 {vals[j].toFixed(1)}</div></>)} onMouseLeave={tip.hide}>
              <rect x={j * bw + 4} y={H - h + 4} width={bw - 8} height={Math.max(h, vals[j] ? 2 : 0)} rx={3} fill="var(--red)" opacity={0.85} />
              {!!d.counts[id] && (
                <text x={j * bw + bw / 2} y={H - h} textAnchor="middle" style={{ fontSize: 10.5 }}>
                  {d.counts[id]}
                </text>
              )}
              <text transform={`translate(${j * bw + bw / 2}, ${H + 16}) rotate(-40)`} textAnchor="end" style={{ fontSize: 10.5 }}>
                {d.short}
              </text>
            </g>
          )
        })}
        <line x1={0} x2={docs.length * bw + 6} y1={H + 4} y2={H + 4} stroke="var(--rule-2)" />
      </svg>
      {tip.node}
    </div>
  )
}

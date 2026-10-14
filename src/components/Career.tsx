// A person's positions on a time axis, one band per system (party, government, army), packed into rows.
import { scaleLinear } from 'd3'
import type { PersonR } from '../data/db'
import { SYSTEMS, type Sys } from '../data/schema'
import { fy, span, today } from '../lib/dates'
import { useWidth } from '../lib/useSize'
import { useTip } from './bits'

const ROW = 22
const GAP = 4

export function Career({ p }: { p: PersonR }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const tip = useTip()
  const end = fy(p.died ?? today())!
  const items = p.positions
    .filter((x) => x.from)
    .map((x) => ({ ...x, a: fy(x.from)!, b: Math.max(fy(x.to) ?? end, fy(x.from)! + 0.15) }))
  if (items.length < 2) return null

  const lo = Math.floor(Math.min(...items.map((x) => x.a)))
  const hi = Math.ceil(Math.max(end, ...items.map((x) => x.b)))
  const left = 46
  const x = scaleLinear().domain([lo, hi]).range([left, Math.max(w - 8, left + 100)])

  // greedy row packing per system
  const bands: { sys: Sys; rows: (typeof items)[] }[] = []
  for (const sys of Object.keys(SYSTEMS) as Sys[]) {
    const rows: (typeof items)[] = []
    for (const it of items.filter((i) => i.sys === sys).sort((m, n) => m.a - n.a)) {
      const r = rows.find((row) => row[row.length - 1].b <= it.a + 0.01)
      if (r) r.push(it)
      else rows.push([it])
    }
    if (rows.length) bands.push({ sys, rows })
  }
  let y = 0
  const placed = bands.map((b) => {
    const top = y
    y += b.rows.length * (ROW + GAP) + 10
    return { ...b, top }
  })
  const H = y + 22
  const step = hi - lo > 40 ? 10 : 5
  const ticks: number[] = []
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t)

  return (
    <div className="card pad" style={{ marginTop: 20 }}>
      <div className="h3">履历</div>
      <div ref={ref}>
      <svg className="career" width={w} height={H} viewBox={`0 0 ${w} ${H}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={H - 18} stroke="var(--rule)" />
            <text x={x(t)} y={H - 4} textAnchor="middle">
              {t}
            </text>
          </g>
        ))}
        {placed.map((b) => (
          <g key={b.sys} transform={`translate(0, ${b.top})`}>
            <text x={0} y={14} style={{ fontWeight: 700, fill: `var(--sys-${b.sys})` }}>
              {SYSTEMS[b.sys]}
            </text>
            {b.rows.map((row, ri) =>
              row.map((it, k) => {
                const x0 = x(it.a)
                const wd = Math.max(x(it.b) - x(it.a) - 1, 3)
                return (
                  <g key={k} onMouseMove={(e) => tip.show(e, <><b>{it.title}</b><div className="m">{span(it.from, it.to)}{it.place ? ` · ${it.place}` : ''}</div></>)} onMouseLeave={tip.hide}>
                    <rect x={x0} y={ri * (ROW + GAP)} width={wd} height={ROW} rx={4} fill={`var(--sys-${b.sys})`} opacity={0.85} />
                    {wd > 60 && (
                      <text className="bar-label" x={x0 + 6} y={ri * (ROW + GAP) + 15}>
                        {clip(it.title, Math.floor((wd - 10) / 11))}
                      </text>
                    )}
                  </g>
                )
              }),
            )}
          </g>
        ))}
      </svg>
      </div>
      {tip.node}
    </div>
  )
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, Math.max(n - 1, 1))}…` : s)

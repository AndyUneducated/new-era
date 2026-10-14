// 履历地铁图: careers as subway lines. One lane per place (中央 on top), time to the right; a line runs along
// the lane of the current post and bends at 45° on a transfer. A ringed station is a top post (secretary, governor, minister and up).
import * as d3 from 'd3'
import type { PersonR } from '../data/db'
import { fy, span, today } from '../lib/dates'
import { NOW, province } from '../lib/faction'
import { go, personHref } from '../lib/router'
import { useWidth } from '../lib/useSize'
import { useTip } from './bits'

const CENTRE = '中央'
const TOP = /(书记|省长|主席|市长|部长|主任|总理|委员长|司令员|政委|总书记)$/

interface Stop { t: number; lane: string; title: string; from?: string; to?: string; big: boolean }
interface Line { p: PersonR; color: string; stops: Stop[]; end: number }

function lineOf(p: PersonR, color: string): Line | null {
  const ps = p.positions.filter((x) => x.from).sort((x, y) => fy(x.from)! - fy(y.from)!)
  if (ps.length < 2) return null
  const stops = ps.map((x) => ({
    t: fy(x.from)!,
    lane: province(x.place) ?? CENTRE,
    title: x.title,
    from: x.from,
    to: x.to,
    big: TOP.test(x.title) && !/副(书记|省长|主席|市长|部长|主任|总理|委员长|司令员|政委)$/.test(x.title),
  }))
  const last = Math.max(...ps.map((x) => fy(x.to) ?? (p.died ? fy(p.died)! : NOW)))
  return { p, color, stops, end: Math.min(last, fy(p.died ?? today())!) }
}

export function Subway({ people, labels = 'stations' }: { people: { p: PersonR; color: string }[]; labels?: 'stations' | 'names' }) {
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const lines = people.map((x) => lineOf(x.p, x.color)).filter((l): l is Line => !!l)
  if (!lines.length) return null

  // lanes in order of first arrival, 中央 first
  const first = new Map<string, number>()
  for (const l of lines) for (const s of l.stops) if (!first.has(s.lane) || first.get(s.lane)! > s.t) first.set(s.lane, s.t)
  const lanes = [...first].sort((x, y) => Number(y[0] === CENTRE) - Number(x[0] === CENTRE) || x[1] - y[1]).map(([k]) => k)
  const GAP = labels === 'stations' ? 46 : 34
  const LEFT = 64
  const PAD_TOP = labels === 'stations' ? 74 : 18
  const W = Math.max(width, 420)
  const H = PAD_TOP + (lanes.length - 1) * GAP + 40
  const lo = Math.floor(Math.min(...lines.map((l) => l.stops[0].t)))
  const hi = Math.ceil(Math.max(...lines.map((l) => l.end)))
  const x = d3.scaleLinear().domain([lo, hi]).range([LEFT, W - (labels === 'names' ? 64 : 16)])
  const laneY = (k: string) => PAD_TOP + lanes.indexOf(k) * GAP
  const off = (i: number) => (i - (lines.length - 1) / 2) * Math.min(4, 18 / lines.length)

  const pathOf = (l: Line, i: number) => {
    const o = off(i)
    let d = `M${x(l.stops[0].t)},${laneY(l.stops[0].lane) + o}`
    for (let k = 1; k < l.stops.length; k++) {
      const a = l.stops[k - 1]
      const b = l.stops[k]
      const ya = laneY(a.lane) + o
      const yb = laneY(b.lane) + o
      const xb = x(b.t)
      if (ya === yb) d += ` H${xb}`
      else {
        const run = Math.min(Math.abs(yb - ya), Math.max(0, xb - x(a.t)) * 0.8)
        d += ` H${xb - run} L${xb},${yb}`
      }
    }
    return `${d} H${x(l.end)}`
  }
  const step = hi - lo > 36 ? 10 : 5
  const ticks = d3.range(Math.ceil(lo / step) * step, hi + 1, step)
  // station names along the top, skipping any that would sit on the previous one
  const labelled = new Set<string>()
  if (labels === 'stations')
    lines[0].stops.reduce((last, s, k) => (x(s.t) - last > 26 ? (labelled.add(`${lines[0].p.id}-${k}`), x(s.t)) : last), -Infinity)

  return (
    <div className="subway" ref={ref}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="履历地铁图">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={PAD_TOP - 14} y2={H - 22} stroke="var(--rule)" />
            <text x={x(t)} y={H - 6} textAnchor="middle" className="sw-tick">
              {t}
            </text>
          </g>
        ))}
        {lanes.map((k) => (
          <g key={k}>
            <line x1={LEFT - 6} x2={W - 8} y1={laneY(k)} y2={laneY(k)} stroke="var(--rule)" strokeDasharray="1 4" />
            <text x={LEFT - 12} y={laneY(k)} dy="0.35em" textAnchor="end" className="sw-lane">
              {k}
            </text>
          </g>
        ))}
        {lines.map((l, i) => (
          <path key={l.p.id} d={pathOf(l, i)} fill="none" stroke={l.color} strokeWidth={labels === 'stations' ? 6 : 4} strokeLinejoin="round" strokeLinecap="round" opacity={0.92} />
        ))}
        {lines.map((l, i) =>
          l.stops.map((s, k) => {
            const cx = x(s.t)
            const cy = laneY(s.lane) + off(i)
            const showLabel = labelled.has(`${l.p.id}-${k}`)
            return (
              <g
                key={`${l.p.id}-${k}`}
                onMouseMove={(e) =>
                  tip.show(
                    e,
                    <div>
                      {labels === 'names' && <b>{l.p.name}　</b>}
                      <b>{s.title}</b>
                      <div className="m">
                        {span(s.from, s.to)} · {s.lane}
                      </div>
                    </div>,
                  )
                }
                onMouseLeave={tip.hide}
                onClick={() => labels === 'names' && go(personHref(l.p.id))}
                style={{ cursor: labels === 'names' ? 'pointer' : undefined }}
              >
                <circle cx={cx} cy={cy} r={s.big ? 6.5 : 4} fill="var(--card)" stroke={s.big ? 'var(--ink)' : l.color} strokeWidth={s.big ? 2.6 : 2} />
                {showLabel && (
                  <text transform={`translate(${cx + 3},${PAD_TOP - 18}) rotate(-38)`} className={s.big ? 'sw-stop big' : 'sw-stop'}>
                    {s.title.length > 12 ? `${s.title.slice(0, 11)}…` : s.title}
                  </text>
                )}
              </g>
            )
          }),
        )}
        {labels === 'names' &&
          lines
            .map((l, i) => ({ l, y: laneY(l.stops.at(-1)!.lane) + off(i) }))
            .sort((m, n) => m.y - n.y)
            .reduce<{ l: Line; y: number }[]>((out, m) => [...out, { ...m, y: Math.max(m.y, (out.at(-1)?.y ?? -Infinity) + 13) }], [])
            .map(({ l, y }) => (
              <text key={l.p.id} x={W - 60} y={y} dy="0.35em" className="sw-name" fill={l.color} onClick={() => go(personHref(l.p.id))}>
                {l.p.name}
              </text>
            ))}
      </svg>
      {tip.node}
    </div>
  )
}

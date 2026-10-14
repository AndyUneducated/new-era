// How many of the faction's people sat in the politburo, in the central committee and in a provincial chief's
// chair in each year since 2000.
import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import type { Atlas, PersonR } from '../data/db'
import type { Faction } from '../data/schema'
import { fy } from '../lib/dates'
import { centre, membersOf, NOW } from '../lib/faction'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'

const CHIEF = /(省委|区党委|自治区党委)书记|省长|自治区(人民政府)?主席|(北京|天津|上海|重庆)市(委书记|长)/
const FIRST = 2000
const H = 220
const PAD = { l: 34, r: 16, t: 14, b: 26 }

type Key = 'pb' | 'cc' | 'chief'
const SERIES: { k: Key; name: string; dash?: string }[] = [
  { k: 'pb', name: '政治局' },
  { k: 'cc', name: '中央委员会', dash: '5 4' },
  { k: 'chief', name: '省级主官', dash: '1 4' },
]

function termOf(a: Atlas, y: number) {
  const cs = a.db.congresses
  return [...cs].reverse().find((c) => (fy(c.opened) ?? 0) <= y + 0.5)
}

function count(a: Atlas, people: PersonR[]) {
  const years = d3.range(FIRST, Math.floor(NOW) + 1)
  return years.map((y) => {
    const t = termOf(a, y)
    const pb = people.filter((p) => t && (a.seats.get(p.id) ?? []).some((s) => s.n === t.n && (s.seat === 'gs' || s.seat === 'psc' || s.seat === 'pb')))
    const cc = people.filter((p) => t && (a.ccOf.get(p.id) ?? []).some((c) => c.n === t.n && !c.alt))
    const chief = people.filter((p) => p.positions.some((x) => CHIEF.test(x.title) && (fy(x.from) ?? Infinity) <= y + 0.5 && (fy(x.to) ?? NOW) >= y + 0.5))
    return { y, pb, cc, chief }
  })
}

export function Rise({ f }: { f: Faction }) {
  const a = useAtlas()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [at, setAt] = useState<number | null>(null)
  const data = useMemo(() => {
    const ids = new Set(membersOf(a, f).map((m) => m.p.id))
    const c = centre(f)
    if (c) ids.add(c)
    return count(a, [...ids].map((id) => a.person.get(id)!))
  }, [a, f])
  const shown = SERIES.filter((s) => data.some((d) => d[s.k].length))
  if (!shown.length) return null
  const W = Math.max(width, 420)
  const x = d3.scaleLinear().domain([FIRST, Math.floor(NOW)]).range([PAD.l, W - PAD.r])
  const max = d3.max(data, (d) => Math.max(...shown.map((s) => d[s.k].length))) ?? 1
  const y = d3.scaleLinear().domain([0, max]).nice().range([H - PAD.b, PAD.t])
  const pick = at === null ? null : data.find((d) => d.y === at)

  return (
    <div className="card pad rise" ref={ref}>
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          setAt(Math.round(x.invert(((e.clientX - r.left) / r.width) * W)))
        }}
        onMouseLeave={() => setAt(null)}
        role="img"
        aria-label={`${f.name}历年席位`}
      >
        {y.ticks(4).map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="cw-tick">
              {t}
            </text>
          </g>
        ))}
        {x.ticks(Math.max(4, Math.floor(W / 90))).map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="cw-tick">
            {t}
          </text>
        ))}
        {a.db.congresses
          .filter((c) => (fy(c.opened) ?? 0) >= FIRST)
          .map((c) => (
            <line key={c.n} x1={x(fy(c.opened)!)} x2={x(fy(c.opened)!)} y1={PAD.t} y2={H - PAD.b} stroke="var(--gold)" strokeOpacity={0.35} strokeDasharray="2 3" />
          ))}
        {shown[0].k === 'pb' && (
          <path d={d3.area<(typeof data)[number]>().x((d) => x(d.y)).y0(y(0)).y1((d) => y(d.pb.length)).curve(d3.curveMonotoneX)(data)!} fill={f.color} opacity={0.14} />
        )}
        {shown.map((s) => (
          <path
            key={s.k}
            d={d3.line<(typeof data)[number]>().x((d) => x(d.y)).y((d) => y(d[s.k].length)).curve(d3.curveMonotoneX)(data)!}
            fill="none"
            stroke={f.color}
            strokeWidth={s.k === 'pb' ? 2.6 : 1.8}
            strokeDasharray={s.dash}
          />
        ))}
        {pick && <line x1={x(pick.y)} x2={x(pick.y)} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink-2)" strokeOpacity={0.4} />}
      </svg>
      <div className="legend small">
        {shown.map((s) => (
          <span key={s.k}>
            <i className={s.dash ? 'dashed' : undefined} style={s.dash ? { borderColor: f.color } : { background: f.color }} />
            {s.name}
            {pick && <b className="tnum"> {pick[s.k].length}</b>}
          </span>
        ))}
        <span className="muted">{pick ? `${pick.y} 年` : '金色虚线为党代会；悬停看当年名单'}</span>
      </div>
      {pick && (
        <div className="rise-names small">
          {shown.map((s) =>
            pick[s.k].length ? (
              <div key={s.k}>
                <b>{s.name}</b> {pick[s.k].map((p) => p.name).join('、')}
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  )
}

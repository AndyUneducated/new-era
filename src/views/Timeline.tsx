// Multi-lane timeline with pan and zoom; a year-grouped list on phones.
import { scaleTime, select, zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LANES, type Event, type Lane } from '../data/schema'
import { fmt, short, today } from '../lib/dates'
import { eventHref, go, useKept } from '../lib/router'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'
import { useTip } from '../components/bits'

const LANE_H = 52
const TOP = 30
const LEFT = 104
const ERAS: [string, string, string][] = [
  ['江泽民时期', '1989-06-24', '2002-11-15'],
  ['胡锦涛时期', '2002-11-15', '2012-11-15'],
  ['习近平时期', '2012-11-15', '2030-01-01'],
]
const LANE_COLOR: Record<Lane, string> = {
  prelude: '#8b7f72',
  power: '#a3201c',
  purge: '#5b2a86',
  army: '#4d6b35',
  ideo: '#b48728',
  econ: '#2f5d8a',
  society: '#c26a1b',
  ethnic: '#2f6f62',
  hkmt: '#b0413e',
  foreign: '#1f5fbf',
  folk: '#d6457a',
}
const PRESETS: [string, string, string][] = [
  ['全部', '1989-01-01', '2027-01-01'],
  ['前史', '1989-01-01', '2001-01-01'],
  ['江胡交接', '2000-01-01', '2005-01-01'],
  ['胡温', '2002-06-01', '2013-01-01'],
  ['习一二任', '2012-06-01', '2022-12-31'],
  ['第三任期', '2022-06-01', '2027-01-01'],
]

const day = (d: string) => new Date(`${d.length === 4 ? `${d}-07-01` : d.length === 7 ? `${d}-15` : d}T00:00:00`)

export function Timeline() {
  const a = useAtlas()
  const [off, setOff] = useKept<Set<Lane>>(new Set())
  const lanes = (Object.keys(LANES) as Lane[]).filter((l) => !off.has(l))
  const toggle = (l: Lane) => setOff((s) => {
    const n = new Set(s)
    if (n.has(l)) n.delete(l)
    else n.add(l)
    return n
  })
  const counts = useMemo(() => {
    const m = new Map<Lane, number>()
    for (const e of a.db.events) m.set(e.lane, (m.get(e.lane) ?? 0) + 1)
    return m
  }, [a])
  const events = a.db.events.filter((e) => !off.has(e.lane))

  return (
    <div className="page wide">
      <div className="tl-head">
        <div>
          <div className="eyebrow">Timeline</div>
          <h1 className="h1" style={{ marginBottom: 4 }}>时间线</h1>
          <p className="muted small" style={{ margin: 0 }}>
            {a.db.events.length} 个事件。滚轮缩放、拖动平移，点击事件查看详情与来源。
          </p>
        </div>
        <div className="chips" style={{ maxWidth: 760, justifyContent: 'flex-end' }}>
          {(Object.keys(LANES) as Lane[]).map((l) => (
            <button key={l} className="chip" onClick={() => toggle(l)} style={{ opacity: off.has(l) ? 0.4 : 1 }} aria-pressed={!off.has(l)}>
              <span className="dot" style={{ background: LANE_COLOR[l] }} />
              {LANES[l]} <span className="muted">{counts.get(l) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="tl-wrap">
        <Lanes lanes={lanes} events={events} />
        <List events={events} />
      </div>
    </div>
  )
}

function Lanes({ lanes, events }: { lanes: Lane[]; events: Event[] }) {
  const [ref, w] = useWidth<HTMLDivElement>(1200)
  const svg = useRef<SVGSVGElement>(null)
  const zb = useRef<ZoomBehavior<SVGSVGElement, unknown>>(null)
  const [t, setT] = useState<ZoomTransform>(zoomIdentity)
  const tip = useTip()
  const H = TOP + lanes.length * LANE_H + 26
  const base = useMemo(() => scaleTime().domain([day('1989-01-01'), day('2027-01-01')]).range([LEFT, Math.max(w - 16, LEFT + 200)]), [w])
  const x = t.rescaleX(base)

  useEffect(() => {
    if (!svg.current) return
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 60])
      .translateExtent([[LEFT, 0], [w - 16, H]])
      .extent([[LEFT, 0], [w - 16, H]])
      .on('zoom', (e: { transform: ZoomTransform }) => setT(e.transform))
    zb.current = z
    const s = select(svg.current).call(z)
    // open on the period the site is about
    const [d0, d1] = [day('1999-06-01'), day('2027-01-01')]
    const k = (base.range()[1] - base.range()[0]) / (base(d1) - base(d0))
    s.call(z.transform, zoomIdentity.translate(LEFT - k * base(d0), 0).scale(k))
    return () => {
      s.on('.zoom', null)
    }
  }, [w, H, base])

  const preset = (from: string, to: string) => {
    if (!svg.current || !zb.current) return
    const k = (base.range()[1] - base.range()[0]) / (base(day(to)) - base(day(from)))
    select(svg.current).transition().duration(600).call(zb.current.transform, zoomIdentity.translate(LEFT - k * base(day(from)), 0).scale(k))
  }

  const ticks = x.ticks(Math.max(Math.floor((w - LEFT) / 90), 4))
  const fmtTick = (d: Date) => (ticks.length > 1 && ticks[1].getFullYear() === ticks[0].getFullYear() ? `${d.getFullYear()}.${d.getMonth() + 1}` : `${d.getFullYear()}`)
  const now = x(day(today()))

  return (
    <div ref={ref} className="tl">
      <div style={{ display: 'flex', gap: 6, padding: '10px 24px', flexWrap: 'wrap' }} className="tl-presets">
        {PRESETS.map(([l, f, to]) => (
          <button key={l} className="chip" onClick={() => preset(f, to)}>
            {l}
          </button>
        ))}
      </div>
      <svg ref={svg} width={w} height={H} style={{ cursor: 'grab' }}>
        <defs>
          <clipPath id="tl-clip">
            <rect x={LEFT} y={0} width={Math.max(w - LEFT, 0)} height={H} />
          </clipPath>
        </defs>
        {lanes.map((l, i) => (
          <g key={l}>
            <rect className={`lane-bg${i % 2 ? ' alt' : ''}`} x={0} y={TOP + i * LANE_H} width={w} height={LANE_H} />
            <circle cx={16} cy={TOP + i * LANE_H + LANE_H / 2} r={4} fill={LANE_COLOR[l]} />
            <text className="lane-label" x={26} y={TOP + i * LANE_H + LANE_H / 2 + 4}>
              {LANES[l]}
            </text>
          </g>
        ))}
        <g clipPath="url(#tl-clip)">
          {ERAS.map(([n, f, to], i) => (
            <g key={n}>
              {i % 2 === 0 && <rect className="era" x={x(day(f))} y={0} width={x(day(to)) - x(day(f))} height={H - 26} />}
              <text className="era-label" x={Math.max(x(day(f)), LEFT) + 8} y={18}>
                {n}
              </text>
            </g>
          ))}
          {ticks.map((d) => (
            <line key={+d} x1={x(d)} x2={x(d)} y1={TOP} y2={H - 26} stroke="var(--rule)" />
          ))}
          {now > LEFT && <line className="now" x1={now} x2={now} y1={TOP} y2={H - 26} />}
          {lanes.map((l, i) => {
            const cy = TOP + i * LANE_H + LANE_H / 2
            const list = events.filter((e) => e.lane === l)
            // labels sit in a row above or below the dots so they never cover one; majors claim space first
            const row = new Map<string, 0 | 1>()
            const spans: [number, number][][] = [[], []]
            for (const e of [...list].sort((m, n) => Number(!!n.major) - Number(!!m.major))) {
              const x0 = x(day(e.date)) - 4
              const x1 = x0 + Math.min(e.title.length, 16) * 11.5
              if (x0 < LEFT - 4 || x0 > w) continue
              const free = ([0, 1] as const).find((r) => !spans[r].some(([s0, s1]) => x0 < s1 + 10 && x1 > s0 - 10))
              if (free === undefined) continue
              spans[free].push([x0, x1])
              row.set(e.id, free)
            }
            return (
              <g key={l}>
                {list.map((e) => {
                  const ex = x(day(e.date))
                  const end = e.end ? x(day(e.end)) : undefined
                  return (
                    <g
                      key={e.id}
                      className="ev"
                      onClick={() => go(eventHref(e.id))}
                      onMouseMove={(m) => tip.show(m, <><b>{e.title}</b><div className="m">{fmt(e.date)}{e.end ? ` — ${fmt(e.end)}` : ''}</div></>)}
                      onMouseLeave={tip.hide}
                    >
                      {end !== undefined && end - ex > 2 && <rect x={ex} y={cy - 3} width={end - ex} height={6} rx={3} fill={LANE_COLOR[l]} opacity={0.3} />}
                      <circle cx={ex} cy={cy} r={e.major ? 6.5 : 4.5} fill={e.major ? LANE_COLOR[l] : 'var(--card)'} stroke={LANE_COLOR[l]} strokeWidth={2} />
                      {row.has(e.id) && (
                        <text x={ex - 4} y={row.get(e.id) ? cy + 19 : cy - 10} style={{ fontWeight: e.major ? 700 : 400 }}>
                          {e.title.length > 16 ? `${e.title.slice(0, 15)}…` : e.title}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </g>
        <g className="axis">
          {ticks.map((d) =>
            x(d) >= LEFT ? (
              <text key={+d} x={x(d)} y={H - 8} textAnchor="middle">
                {fmtTick(d)}
              </text>
            ) : null,
          )}
        </g>
      </svg>
      {tip.node}
    </div>
  )
}

function List({ events }: { events: Event[] }) {
  const years = new Map<string, Event[]>()
  for (const e of [...events].reverse()) years.set(e.date.slice(0, 4), [...(years.get(e.date.slice(0, 4)) ?? []), e])
  return (
    <div className="tl-list">
      {[...years].map(([y, list]) => (
        <div key={y}>
          <div className="group-title">{y}</div>
          {list.map((e) => (
            <a key={e.id} href={eventHref(e.id)} style={{ display: 'grid', gridTemplateColumns: '12px 64px 1fr', gap: 8, padding: '8px 0', borderTop: '1px solid var(--rule)', alignItems: 'baseline' }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: LANE_COLOR[e.lane], display: 'inline-block' }} />
              <span className="tnum muted small">{short(e.date).slice(5) || y}</span>
              <span style={{ fontWeight: e.major ? 700 : 400 }}>{e.title}</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  )
}

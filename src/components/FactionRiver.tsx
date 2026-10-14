// 派系河流: the full members of the sitting central committee, quarter by quarter, by faction in one frame.
// A stream swells at a congress and thins when its people fall mid-term.
import * as d3 from 'd3'
import { useMemo } from 'react'
import type { Frame } from '../data/schema'
import { fy } from '../lib/dates'
import { NOW, fallYear, shortName } from '../lib/faction'
import { go, factionHref } from '../lib/router'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'
import { useTip } from './bits'

const START = 2000

export function FactionRiver({ frame }: { frame: Frame }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const W = Math.max(width, 520)
  const H = Math.min(420, Math.max(260, W * 0.36))

  const { rows, keys, terms } = useMemo(() => {
    const terms = [...a.db.congresses].sort((x, y) => x.n - y.n).map((c) => ({ n: c.n, at: fy(c.opened) ?? 0 }))
    const byTerm = new Map<number, string[]>()
    for (const [id, list] of a.ccOf) for (const c of list) if (!c.alt) byTerm.set(c.n, [...(byTerm.get(c.n) ?? []), id])
    const keys = a.db.factions.filter((f) => f.frame === frame).map((f) => f.id)
    const rows: ({ t: number; total: number } & Record<string, number>)[] = []
    const start = Math.max(START, terms.find((c) => byTerm.has(c.n))?.at ?? START)
    for (let t = start; t <= NOW; t += 0.25) {
      const term = terms.filter((c) => c.at <= t).at(-1)
      const row = { t, total: 0 } as { t: number; total: number } & Record<string, number>
      for (const k of keys) row[k] = 0
      for (const id of byTerm.get(term?.n ?? -1) ?? []) {
        const p = a.person.get(id)!
        const fell = fallYear(p)
        if (fell !== undefined && fell <= t) continue
        row.total++
        const f = a.factionIn(p, frame)
        if (f) row[f.id]++
      }
      rows.push(row)
    }
    return { rows, keys: keys.filter((k) => rows.some((r) => r[k] > 0)), terms: terms.filter((c) => c.at >= start) }
  }, [a, frame])
  const start = rows[0]?.t ?? START

  const series = d3.stack<(typeof rows)[number]>().keys(keys).offset(d3.stackOffsetWiggle).order(d3.stackOrderInsideOut)(rows)
  const x = d3.scaleLinear().domain([start, NOW]).range([8, W - 8])
  const lo = d3.min(series, (s) => d3.min(s, (d) => d[0])) ?? 0
  const hi = d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 1
  const y = d3.scaleLinear().domain([lo, hi]).range([H - 30, 14])
  const area = d3
    .area<d3.SeriesPoint<(typeof rows)[number]>>()
    .x((d) => x(d.data.t))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]))
    .curve(d3.curveBasis)

  if (!keys.length) return <div className="empty">此框架下尚无中央委员的派系标注</div>
  const at = (e: React.MouseEvent<SVGElement>) => {
    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect()
    const t = x.invert(((e.clientX - box.left) / box.width) * W)
    return rows[Math.max(0, Math.min(rows.length - 1, Math.round((t - start) / 0.25)))]
  }
  return (
    <div className="river" ref={ref}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="各派系在中央委员会中的人数随时间变化">
        {terms.map((c) => (
          <g key={c.n}>
            <line x1={x(c.at)} x2={x(c.at)} y1={8} y2={H - 22} stroke="var(--rule-2)" strokeDasharray="2 3" />
            <text x={x(c.at)} y={H - 8} textAnchor={c.at < start + 1 ? 'start' : 'middle'} className="rv-term">
              {c.n} 大 · {Math.floor(c.at)}
            </text>
          </g>
        ))}
        {series.map((s) => {
          const f = a.faction.get(s.key)!
          // label at the widest point
          const wide = s.reduce((m, d, i) => (d[1] - d[0] > s[m][1] - s[m][0] ? i : m), 0)
          const d = s[wide]
          const thick = y(d[0]) - y(d[1])
          return (
            <g key={s.key} className="rv-stream" onClick={() => go(factionHref(f.id))}>
              <path
                d={area(s) ?? undefined}
                fill={f.color}
                fillOpacity={0.82}
                stroke="var(--card)"
                strokeWidth={0.8}
                onMouseMove={(e) => {
                  const r = at(e)
                  tip.show(
                    e,
                    <div>
                      <b style={{ color: f.color }}>{f.name}</b>
                      <div className="m">
                        {Math.floor(r.t)} 年 · 在任中委 {r[s.key]} 人 / 共 {r.total} 人有档案
                      </div>
                    </div>,
                  )
                }}
                onMouseLeave={tip.hide}
              />
              {thick > 13 && (
                <text x={Math.min(Math.max(x(d.data.t), 50), W - 50)} y={(y(d[0]) + y(d[1])) / 2} dy="0.35em" textAnchor="middle" className="rv-label">
                  {shortName(f)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {tip.node}
    </div>
  )
}

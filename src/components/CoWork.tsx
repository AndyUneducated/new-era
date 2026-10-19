// One lane per member: every recorded post as a grey bar, the years spent in the same province as the
// centre of the faction in the faction's colour. It shows what a label rests on, or that it rests on nothing.
import * as d3 from 'd3'
import { useMemo } from 'react'
import type { Faction } from '../data/schema'
import { centre, fallYear, membersOf, NOW, overlaps, stints } from '../lib/faction'
import { fy } from '../lib/dates'
import { go, personHref, useKept } from '../lib/router'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'
import { useTip } from './bits'

const ROW = 24
const LABEL = 76
const FOLD = 18

export function CoWork({ f }: { f: Faction }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [all, setAll] = useKept(false)
  const hub = centre(f) ? a.person.get(centre(f)!) : undefined
  const rows = useMemo(() => {
    if (!hub) return []
    const hs = stints(hub)
    return membersOf(a, f)
      .map((m) => ({ p: m.p, posts: m.p.positions.filter((x) => x.from), ov: overlaps(hs, stints(m.p)) }))
      .filter((r) => r.posts.length)
      .sort((x, y) => (y.ov.length ? 1 : 0) - (x.ov.length ? 1 : 0) || (x.ov[0]?.from ?? 9999) - (y.ov[0]?.from ?? 9999) || x.p.name.localeCompare(y.p.name, 'zh'))
  }, [a, f, hub])
  if (!hub || !rows.length) return null
  const shown = all ? rows : rows.slice(0, FOLD)
  const lead: { place: string; from: number; to: number }[] = []
  for (const s of [...stints(hub)].sort((p, q) => p.from - q.from)) {
    const last = lead.at(-1)
    if (last && last.place === s.place && s.from <= last.to + 0.5) last.to = Math.max(last.to, s.to)
    else lead.push({ place: s.place, from: s.from, to: s.to })
  }
  const start = Math.max(1965, Math.min(1975, ...rows.flatMap((r) => r.posts.map((x) => fy(x.from)!))))
  const sx = d3.scaleLinear().domain([start, NOW]).range([LABEL, Math.max(width, 480) - 10])
  const x = (v: number) => sx(Math.max(v, start))
  const ticks = sx.ticks(Math.max(4, Math.floor(width / 110)))
  const h = (shown.length + 1) * ROW + 28
  const withOverlap = rows.filter((r) => r.ov.length).length

  return (
    <div className="card pad cowork" ref={ref}>
      <svg width="100%" height={h} viewBox={`0 0 ${Math.max(width, 480)} ${h}`} role="img" aria-label={`${f.name}成员与${hub.name}的同地任职`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={0} y2={h - 22} stroke="var(--rule)" />
            <text x={x(t)} y={h - 8} textAnchor="middle" className="cw-tick">
              {t}
            </text>
          </g>
        ))}
        {lead.map((s, i) => (
          <rect key={i} x={x(s.from)} y={0} width={Math.max(1, x(s.to) - x(s.from))} height={h - 22} fill={f.color} opacity={0.05} />
        ))}
        <g transform="translate(0,0)">
          <text x={LABEL - 8} y={ROW * 0.68} textAnchor="end" className="cw-name hub">
            {hub.name}
          </text>
          {lead.map((s, i) => (
            <g key={i}>
              <rect x={x(s.from)} y={5} width={Math.max(2, x(s.to) - x(s.from))} height={ROW - 10} rx={3} fill={f.color} />
              {x(s.to) - x(s.from) > 26 && (
                <text x={x(s.from) + 4} y={ROW * 0.66} className="cw-place">
                  {s.place}
                </text>
              )}
            </g>
          ))}
        </g>
        {shown.map((r, i) => {
          const y = (i + 1) * ROW
          const fell = fallYear(r.p)
          return (
            <g key={r.p.id} transform={`translate(0,${y})`} className="cw-row" onClick={() => go(personHref(r.p.id))}>
              <text x={LABEL - 8} y={ROW * 0.68} textAnchor="end" className="cw-name">
                {r.p.name}
              </text>
              {r.posts.map((p, j) => {
                const from = fy(p.from)!
                const to = fy(p.to) ?? (fell ?? NOW)
                return (
                  <rect
                    key={j}
                    x={x(from)}
                    y={9}
                    width={Math.max(1.5, x(to) - x(from))}
                    height={ROW - 18}
                    fill="var(--rule-2)"
                    onMouseMove={(e) => tip.show(e, <><b>{r.p.name}</b><div>{p.title}</div><div className="m">{p.from}–{p.to ?? ''}{p.place ? ` · ${p.place}` : ''}</div></>)}
                    onMouseLeave={tip.hide}
                  />
                )
              })}
              {r.ov.map((o, j) => (
                <rect
                  key={`o${j}`}
                  x={x(o.from)}
                  y={6}
                  width={Math.max(2, x(o.to) - x(o.from))}
                  height={ROW - 12}
                  rx={2}
                  fill={f.color}
                  onMouseMove={(e) => tip.show(e, <><b>{r.p.name}</b> 与 {hub.name} 同在{o.place}<div>{o.title}</div><div className="m">时{hub.name}任{o.with}，{Math.floor(o.from)}–{Math.floor(o.to)}</div></>)}
                  onMouseLeave={tip.hide}
                />
              ))}
              {fell !== undefined && <text x={x(fell)} y={ROW * 0.72} textAnchor="middle" className="cw-fall">✕</text>}
            </g>
          )
        })}
      </svg>
      <div className="legend small">
        <span>
          <i style={{ background: f.color }} />
          与{hub.name}同在一省任职（{withOverlap} / {rows.length} 人）
        </span>
        <span>
          <i style={{ background: 'var(--rule-2)' }} />
          其他职务
        </span>
        <span style={{ color: 'var(--red)' }}>✕ 落马</span>
        {rows.length > FOLD && (
          <button className="chip" onClick={() => setAll(!all)}>
            {all ? '收起' : `展开其余 ${rows.length - FOLD} 人`}
          </button>
        )}
      </div>
      {tip.node}
    </div>
  )
}

// 主义谱系: each ism as a bar over the years it was a live position, one lane per kind; solid curves run to
// where it came from, dashed ones to what it was raised against. Hover follows a line of descent.
import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import { ISM_KINDS, type Ism } from '../../data/schema'
import { fy } from '../../lib/dates'
import { NOW } from '../../lib/faction'
import { FIRST_YEAR, fromT, ismColor, KIND_ORDER, toT } from '../../lib/isms'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { useTip } from '../bits'

const ROW = 24
const HEAD = 26
const LANE_PAD = 26

interface Placed { m: Ism; row: number; y: number }
// isms older than the chart (Marxism-Leninism, liberalism) start at its left edge
const scale = (W: number) => d3.scaleLinear().domain([FIRST_YEAR, NOW]).range([12, W - 12]).clamp(true)

export function Lineage({ pick, onPick }: { pick: string | null; onPick: (id: string | null) => void }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<string | null>(null)
  const W = Math.max(width, 640)
  const x = scale(W)

  const { placed, lanes, H } = useMemo(() => {
    const x = scale(W)
    const placed = new Map<string, Placed>()
    const lanes: { kind: (typeof KIND_ORDER)[number]; y: number; h: number }[] = []
    let y = HEAD
    for (const kind of KIND_ORDER) {
      const list = a.db.isms.filter((m) => m.kind === kind).sort((p, q) => fromT(p) - fromT(q))
      if (!list.length) continue
      const ends: number[] = []
      for (const m of list) {
        const x0 = x(fromT(m))
        const x1 = Math.max(x(toT(m)), x0 + (m.short ?? m.name).length * 12.5 + 14)
        let row = ends.findIndex((e) => e + 6 < x0)
        if (row < 0) row = ends.push(0) - 1
        ends[row] = x1
        placed.set(m.id, { m, row, y: y + LANE_PAD + row * ROW })
      }
      lanes.push({ kind, y, h: LANE_PAD + ends.length * ROW + 8 })
      y += LANE_PAD + ends.length * ROW + 14
    }
    return { placed, lanes, H: y + 4 }
  }, [a, W])

  // the line of descent through the hovered (or picked) ism: ancestors, descendants and direct opponents
  const near = useMemo(() => {
    const id = hover ?? pick
    if (!id) return null
    const out = new Set([id])
    const up = (k: string) => a.ism.get(k)?.parents.forEach((p) => !out.has(p) && (out.add(p), up(p)))
    const down = (k: string) => a.db.isms.forEach((m) => m.parents.includes(k) && !out.has(m.id) && (out.add(m.id), down(m.id)))
    up(id)
    down(id)
    a.ism.get(id)?.against.forEach((k) => out.add(k))
    a.db.isms.forEach((m) => m.against.includes(id) && out.add(m.id))
    return out
  }, [a, hover, pick])

  if (!a.db.isms.length) return <div className="empty">主义条目尚在整理</div>
  const ticks = x.ticks(Math.floor(W / 80))
  const congresses = a.db.congresses.map((c) => fy(c.opened)!).filter((t) => t >= FIRST_YEAR)
  const links = a.db.isms.flatMap((m) => [
    ...m.parents.map((p) => ({ from: p, to: m.id, kind: 'parent' as const })),
    ...m.against.map((p) => ({ from: p, to: m.id, kind: 'against' as const })),
  ])

  return (
    <div className="card pad lineage-v" ref={ref}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="主义谱系">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={HEAD - 6} y2={H} stroke="var(--rule)" />
            <text x={x(t)} y={14} textAnchor="middle" className="cw-tick">
              {t}
            </text>
          </g>
        ))}
        {congresses.map((t) => (
          <line key={t} x1={x(t)} x2={x(t)} y1={HEAD - 6} y2={H} stroke="var(--gold)" strokeOpacity={0.35} strokeDasharray="2 4" />
        ))}
        {lanes.map((l) => (
          <g key={l.kind}>
            <rect x={4} y={l.y} width={W - 8} height={l.h} rx={10} fill={ismColor(l.kind)} fillOpacity={0.045} />
            <text x={14} y={l.y + 17} className="ln-lane" fill={ismColor(l.kind)}>
              {ISM_KINDS[l.kind]}
            </text>
          </g>
        ))}
        {links.map((k, i) => {
          const p = placed.get(k.from)
          const q = placed.get(k.to)
          if (!p || !q) return null
          const tx = x(fromT(q.m))
          const sx = Math.min(Math.max(x(fromT(p.m)) + 8, tx - 60), x(toT(p.m)))
          const sy = p.y + 15
          const ty = q.y + 15
          const on = !near || (near.has(k.from) && near.has(k.to))
          return (
            <path
              key={i}
              d={`M${sx},${sy} C${sx + (tx - sx) * 0.6},${sy} ${tx - 30},${ty} ${tx},${ty}`}
              fill="none"
              stroke={k.kind === 'parent' ? ismColor(p.m.kind) : 'var(--muted)'}
              strokeWidth={k.kind === 'parent' ? 1.4 : 1}
              strokeDasharray={k.kind === 'against' ? '3 3' : undefined}
              opacity={on ? (near ? 0.9 : 0.35) : 0.05}
            />
          )
        })}
        {[...placed.values()].map(({ m, y }) => {
          const x0 = x(fromT(m))
          const x1 = x(toT(m))
          const on = !near || near.has(m.id)
          return (
            <g
              key={m.id}
              className="ln-ism"
              opacity={on ? 1 : 0.18}
              onMouseEnter={() => setHover(m.id)}
              onMouseMove={(e) =>
                tip.show(
                  e,
                  <>
                    <b>{m.name}</b>
                    <div className="m">
                      {ISM_KINDS[m.kind]} · {m.from.slice(0, 4)}–{m.to ? m.to.slice(0, 4) : '今'}
                    </div>
                    <div style={{ marginTop: 4, maxWidth: 320 }}>{m.summary.slice(0, 90)}{m.summary.length > 90 ? '…' : ''}</div>
                  </>,
                )
              }
              onMouseLeave={() => {
                setHover(null)
                tip.hide()
              }}
              onClick={() => onPick(pick === m.id ? null : m.id)}
            >
              <rect x={x0} y={y + 12} width={Math.max(4, x1 - x0)} height={6} rx={3} fill={ismColor(m.kind)} fillOpacity={m.kind === 'label' ? 0.45 : 0.85} />
              {!m.to && <circle cx={x1} cy={y + 15} r={3} fill={ismColor(m.kind)} />}
              <text x={x0 + 1} y={y + 8} className={`ln-name${pick === m.id ? ' on' : ''}`}>
                {m.short ?? m.name}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="legend small">
        <span>色条＝作为现实主张存在的年份</span>
        <span>
          <i className="dashed" style={{ borderColor: 'var(--ink-2)', borderStyle: 'solid' }} />
          源头
        </span>
        <span>
          <i className="dashed" style={{ borderColor: 'var(--muted)' }} />
          所针对的
        </span>
        <span className="muted">金色虚线为党代会；点击主义看详情</span>
      </div>
      {tip.node}
    </div>
  )
}

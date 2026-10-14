// 落马按月分布: every fallen person as one cell in the month of the first official step against them,
// civilians stacked above the axis and the army below, highest rank nearest the axis.
import { useMemo } from 'react'
import { congressName } from '../../lib/cn'
import { fmt, fy } from '../../lib/dates'
import { NOW } from '../../lib/faction'
import { LEVELS, type Fall, type Level } from '../../lib/purge'
import { go, personHref } from '../../lib/router'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { useTip } from '../bits'

const START = 2000
const RANK: Record<Level, number> = { top: 0, cc: 1, min: 2, other: 3 }
const PAD = { l: 34, r: 8, t: 54, b: 40 }

export function FallMonths({ list, onYear }: { list: Fall[]; onYear?: (y: number) => void }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const W = Math.max(width, 560)
  const months = Math.ceil((NOW - START) * 12)
  const cw = (W - PAD.l - PAD.r) / months

  const cols = useMemo(() => {
    const m = new Map<number, { up: Fall[]; down: Fall[] }>()
    for (const f of list) {
      const i = Math.min(months - 1, Math.floor((f.t - START) * 12))
      const c = m.get(i) ?? { up: [], down: [] }
      ;(f.army ? c.down : c.up).push(f)
      m.set(i, c)
    }
    for (const c of m.values()) for (const s of [c.up, c.down]) s.sort((x, y) => RANK[x.level] - RANK[y.level])
    return m
  }, [list, months])

  const x = (t: number) => PAD.l + (t - START) * 12 * cw
  // names of the highest falls beyond their columns, staggered in rows so neighbours do not collide
  const lanes = { up: [] as number[], down: [] as number[] }
  const labels = list
    .filter((f) => f.level === 'top')
    .map((f) => {
      const px = x(f.t) + cw / 2
      const lane = f.army ? lanes.down : lanes.up
      let k = 0
      while (lane[k] !== undefined && px - lane[k] < 46) k++
      lane[k] = px
      return { f, px, k }
    })

  const maxUp = Math.max(1, ...[...cols.values()].map((c) => c.up.length))
  const maxDown = Math.max(1, ...[...cols.values()].map((c) => c.down.length))
  const ch = Math.max(2.5, Math.min(7, 190 / (maxUp + maxDown)))
  const top = PAD.t + lanes.up.length * 11
  const axis = top + maxUp * ch + 4
  const bottom = axis + maxDown * ch + 4
  const H = bottom + lanes.down.length * 11 + PAD.b

  const years = Array.from({ length: Math.floor(NOW) - START + 1 }, (_, i) => START + i)
  const perYear = new Map<number, number>()
  for (const f of list) perYear.set(Math.floor(f.t), (perYear.get(Math.floor(f.t)) ?? 0) + 1)
  const congresses = a.db.congresses.filter((c) => (fy(c.opened) ?? 0) >= START)

  const show = (e: React.MouseEvent, f: Fall) =>
    tip.show(
      e,
      <div className="pg-tip">
        <b>{f.p.name}</b> <span className="m">{fmt(f.date)}</span>
        <div className="m">{f.p.headline}</div>
        <div>{f.p.fall.find((s) => s.date === f.date)?.text}</div>
      </div>,
    )

  return (
    <div className="pg-months" ref={ref}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="落马按月分布">
        {congresses.map((c) => {
          const cx = x(fy(c.opened)!)
          return (
            <g key={c.n} className="pg-cong">
              <line x1={cx} x2={cx} y1={PAD.t - 30} y2={bottom} />
              <text x={cx + 3} y={PAD.t - 34}>
                {congressName(c.n)}
              </text>
            </g>
          )
        })}
        {[...cols.entries()].map(([i, c]) =>
          [...c.up.map((f, j) => [f, axis - 2 - (j + 1) * ch] as const), ...c.down.map((f, j) => [f, axis + 2 + j * ch] as const)].map(([f, y]) => (
            <rect
              key={f.p.id}
              x={PAD.l + i * cw + 0.3}
              y={y}
              width={Math.max(1, cw - 0.6)}
              height={ch - 0.6}
              fill={LEVELS[f.level].color}
              className="pg-cell"
              onMouseMove={(e) => show(e, f)}
              onMouseLeave={tip.hide}
              onClick={() => go(personHref(f.p.id))}
            />
          )),
        )}
        <line x1={PAD.l} x2={W - PAD.r} y1={axis} y2={axis} className="pg-axis" />
        <text x={PAD.l - 6} y={axis - 6} textAnchor="end" className="pg-side">
          文
        </text>
        <text x={PAD.l - 6} y={axis + 14} textAnchor="end" className="pg-side">
          军
        </text>
        {labels.map(({ f, px, k }) => {
          const c = cols.get(Math.min(months - 1, Math.floor((f.t - START) * 12)))!
          const y0 = f.army ? axis + 2 + c.down.length * ch + 2 : axis - 2 - c.up.length * ch - 2
          const y1 = f.army ? bottom + 9 + k * 11 : top - 4 - k * 11
          return (
            <g key={f.p.id} className="pg-top">
              <line x1={px} x2={px} y1={y0} y2={f.army ? y1 - 8 : y1 + 2} />
              <text x={px} y={y1} textAnchor="middle">
                {f.p.name}
              </text>
            </g>
          )
        })}
        {years.map((y) => (
          <g key={y} className="pg-year" onClick={() => onYear?.(y)}>
            <line x1={x(y)} x2={x(y)} y1={axis - 3} y2={axis + 3} />
            {(W > 900 || y % 2 === 0) && (
              <text x={x(y + 0.5)} y={H - PAD.b + 14} textAnchor="middle">
                {String(y).slice(2)}
              </text>
            )}
            {(perYear.get(y) ?? 0) > 0 && (W > 900 || y % 2 === 0) && (
              <text x={x(y + 0.5)} y={H - PAD.b + 25} textAnchor="middle" className="n">
                {perYear.get(y)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="pg-key">
        {(Object.keys(LEVELS) as Level[]).map((k) => (
          <span key={k}>
            <i style={{ background: LEVELS[k].color }} />
            {LEVELS[k].name}
          </span>
        ))}
        <span className="m">轴上文官，轴下军队；一格一人，落在第一次官方通报的月份；底行数字为当年人数</span>
      </div>
      {tip.node}
    </div>
  )
}

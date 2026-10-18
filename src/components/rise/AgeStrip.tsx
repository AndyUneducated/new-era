// Ages at each rung: one row per rung, a dot per person, the median marked.
import { scaleLinear } from 'd3'
import { RUNGS, type Rung } from '../../data/schema'
import { median, type RungAge } from '../../lib/rise'
import { go, personHref } from '../../lib/router'
import { useWidth } from '../../lib/useSize'
import { useTip } from '../bits'

export function AgeStrip({ ages, mark }: { ages: Record<Rung, RungAge[]>; mark?: (id: string) => boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const tip = useTip()
  const rows = (Object.keys(RUNGS) as Rung[]).filter((k) => ages[k].length)
  const RH = 46
  const pad = { l: 92, r: 16, t: 8, b: 26 }
  const H = pad.t + rows.length * RH + pad.b
  const x = scaleLinear().domain([25, 70]).range([pad.l, w - pad.r])
  return (
    <div ref={ref} className="sums">
      <svg width={w} height={H} className="agestrip">
        {[30, 35, 40, 45, 50, 55, 60, 65].map((v) => (
          <g key={v} className="grid-x">
            <line x1={x(v)} x2={x(v)} y1={pad.t} y2={H - pad.b} />
            <text x={x(v)} y={H - pad.b + 16} textAnchor="middle">
              {v} 岁
            </text>
          </g>
        ))}
        {rows.map((k, i) => {
          const y = pad.t + i * RH + RH / 2
          const list = ages[k]
          const mid = median(list.map((r) => r.age))!
          // people at the same age stack upward a little
          const seen = new Map<number, number>()
          return (
            <g key={k}>
              <text className="ag-rung" x={pad.l - 10} y={y + 4} textAnchor="end">
                {RUNGS[k]}
              </text>
              <line className="ag-mid" x1={x(mid)} x2={x(mid)} y1={y - RH / 2 + 6} y2={y + RH / 2 - 6} />
              <text className="ag-mid-t" x={x(mid) + 4} y={y - RH / 2 + 14}>
                中位 {mid}
              </text>
              {list.map((r) => {
                const n = seen.get(r.age) ?? 0
                seen.set(r.age, n + 1)
                const on = mark?.(r.p.id)
                return (
                  <circle
                    key={r.p.id}
                    className={on ? 'dot late' : on === false ? 'dot dim' : 'dot late'}
                    cx={x(r.age)}
                    cy={y + 8 - n * 7}
                    r={on ? 5 : 3.6}
                    onMouseMove={(e) =>
                      tip.show(
                        e,
                        <div className="pg-tip">
                          <b>{r.p.name}</b>
                          <span>
                            {r.age} 岁 · {r.date.slice(0, 7)}
                          </span>
                          <span className="m">{r.post}</span>
                        </div>,
                      )
                    }
                    onMouseLeave={tip.hide}
                    onClick={() => go(personHref(r.p.id))}
                  />
                )
              })}
            </g>
          )
        })}
      </svg>
      {tip.node}
    </div>
  )
}

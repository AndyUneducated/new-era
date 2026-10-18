// 与换届的时间关系: first steps counted by quarter before and after the nearest party congress.
import { scaleLinear } from 'd3'
import { CONGRESS_DATES, months, type Fall } from '../../lib/purge'
import { useWidth } from '../../lib/useSize'
import { useTip } from '../bits'

const SPAN = 30
const BIN = 3

export function Timing({ list }: { list: Fall[] }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const tip = useTip()
  const rel = list
    .filter((f) => f.date.length >= 7)
    .map((f) => {
      const near = CONGRESS_DATES.map(([name, d]) => ({ name, m: months(d, f.date) })).sort((a, b) => Math.abs(a.m) - Math.abs(b.m))[0]
      return { f, ...near }
    })
    .filter((r) => Math.abs(r.m) <= SPAN)
  const bins = new Map<number, typeof rel>()
  for (const r of rel) {
    const k = Math.floor(r.m / BIN) * BIN
    bins.set(k, [...(bins.get(k) ?? []), r])
  }
  const H = 220
  const pad = { l: 30, r: 10, t: 14, b: 34 }
  const x = scaleLinear().domain([-SPAN, SPAN + BIN]).range([pad.l, w - pad.r])
  const max = Math.max(1, ...[...bins.values()].map((b) => b.length))
  const y = scaleLinear().domain([0, max]).range([H - pad.b, pad.t])
  const bw = x(BIN) - x(0) - 2
  return (
    <div ref={ref}>
      <svg width={w} height={H} className="timing">
        <line className="cong" x1={x(0)} x2={x(0)} y1={pad.t - 6} y2={H - pad.b} />
        <text className="cong" x={x(0)} y={pad.t - 2} textAnchor="middle">
          党代会召开
        </text>
        {[...bins].map(([k, b]) => (
          <rect
            key={k}
            x={x(k) + 1}
            y={y(b.length)}
            width={Math.max(bw, 1)}
            height={y(0) - y(b.length)}
            className={k < 0 ? 'before' : 'after'}
            onMouseMove={(e) =>
              tip.show(
                e,
                <div className="pg-tip">
                  <b>
                    {k < 0 ? `会前 ${-k - BIN + 1}–${-k} 个月` : `会后 ${k}–${k + BIN - 1} 个月`} · {b.length} 人
                  </b>
                  <span>{b.map((r) => `${r.f.p.name}（${r.name}）`).join('、')}</span>
                </div>,
              )
            }
            onMouseLeave={tip.hide}
          />
        ))}
        {[-24, -12, 0, 12, 24].map((v) => (
          <text key={v} className="axis-x" x={x(v)} y={H - pad.b + 16} textAnchor="middle">
            {v === 0 ? '0' : v < 0 ? `会前 ${-v / 12} 年` : `会后 ${v / 12} 年`}
          </text>
        ))}
      </svg>
      <div className="pg-key">
        <span className="m">
          {rel.length} 人的第一步落在某次党代会前后 {SPAN / 12} 年半内，以离得最近的一次计；每格三个月
        </span>
      </div>
      {tip.node}
    </div>
  )
}

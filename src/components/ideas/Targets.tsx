// 增长目标: the growth target each government work report set, as a step line; a range is a band,
// a year without a stated target is a gap. Hover a year for the sentence it comes from.
import * as d3 from 'd3'
import { quoted } from '../../lib/quotes'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { Src, useTip } from '../bits'

export function Targets() {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const list = a.db.targets
  if (list.length < 3) return <div className="empty">政府工作报告的增长目标尚未载入</div>
  const W = Math.max(width, 480)
  const H = 250
  const years = list.map((t) => t.year)
  const x = d3.scaleBand<number>().domain(d3.range(d3.min(years)!, d3.max(years)! + 1)).range([34, W - 8]).padding(0.18)
  const y = d3.scaleLinear().domain([4, 9]).range([H - 30, 14])
  const by = new Map(list.map((t) => [t.year, t]))
  const steps = list.filter((t) => t.lo !== null)
  const line = d3
    .line<(typeof list)[number]>()
    .x((t) => x(t.year)! + x.bandwidth() / 2)
    .y((t) => y(((t.lo ?? 0) + (t.hi ?? 0)) / 2))
    .curve(d3.curveStepAfter)
    .defined((t) => t.lo !== null)
  const show = (e: React.MouseEvent, yr: number) => {
    const t = by.get(yr)
    tip.show(
      e,
      t ? (
        <div style={{ maxWidth: 300 }}>
          <b>{yr} 年：{t.label}</b>
          <div style={{ marginTop: 4 }}>{quoted(t.quote)}</div>
        </div>
      ) : (
        <div>
          <b>{yr}</b> <span className="m">报告原文中未找到明确的年度增长目标</span>
        </div>
      ),
    )
  }
  return (
    <div className="targets" ref={ref}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="历年政府工作报告的经济增长目标">
        {[4, 5, 6, 7, 8, 9].map((v) => (
          <g key={v}>
            <line x1={30} x2={W - 8} y1={y(v)} y2={y(v)} stroke="var(--rule)" />
            <text x={26} y={y(v)} dy="0.35em" textAnchor="end" className="tg-axis">
              {v}%
            </text>
          </g>
        ))}
        <path d={line(list) ?? undefined} fill="none" stroke="var(--red)" strokeWidth={2.4} />
        {x.domain().map((yr) => {
          const t = by.get(yr)
          const cx = x(yr)! + x.bandwidth() / 2
          return (
            <g key={yr} onMouseMove={(e) => show(e, yr)} onMouseLeave={tip.hide}>
              <rect x={x(yr)} y={8} width={x.bandwidth()} height={H - 36} fill="transparent" />
              {t && t.lo !== null && t.hi !== null && (
                <>
                  {t.hi > t.lo && <rect x={x(yr)! + 2} y={y(t.hi)} width={x.bandwidth() - 4} height={y(t.lo) - y(t.hi)} rx={3} className="tg-band" />}
                  <circle cx={cx} cy={y((t.lo + t.hi) / 2)} r={4} className={t.label.includes('以上') ? 'tg-dot up' : 'tg-dot'} />
                </>
              )}
              {t && t.lo === null && (
                <text x={cx} y={y(6.5)} textAnchor="middle" className="tg-none" writingMode="vertical-rl">
                  未设目标
                </text>
              )}
              {yr % 2 === 0 && (
                <text x={cx} y={H - 12} textAnchor="middle" className="tg-axis">
                  {yr}
                </text>
              )}
            </g>
          )
        })}
        {steps
          .filter((t, i) => i === 0 || t.lo !== steps[i - 1].lo || t.hi !== steps[i - 1].hi)
          .map((t) => (
            <text key={t.year} x={x(t.year)! + x.bandwidth() / 2} y={y(t.hi!) - 9} textAnchor="middle" className="tg-label">
              {t.label}
            </text>
          ))}
      </svg>
      <div className="small muted">
        来源：历年《政府工作报告》全文，如 <Src cite={list.at(-1)!.cite} />；空缺的年份是原文中没有找到明确表述的年份。
      </div>
      {tip.node}
    </div>
  )
}

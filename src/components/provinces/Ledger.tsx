// 诸侯谱: every province since 2000 as two stacked strips (secretary above, governor below),
// one segment per tenure in the holder's faction colour; a seal-red tick closes a tenure that ended in a fall.
import * as d3 from 'd3'
import { useMemo } from 'react'
import { REGIONS, type Frame, type Province } from '../../data/schema'
import { FIRST, fellAfter, tenures, type Tenure } from '../../lib/chiefs'
import { NOW } from '../../lib/faction'
import { fy } from '../../lib/dates'
import { go, personHref } from '../../lib/router'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { useTip } from '../bits'
import { TenureTip } from './TenureTip'

const ROW = 26
const GAP = 22
const LEFT = 58

export function Ledger({ year, frame, pick, onPick, onYear }: { year: number; frame: Frame; pick?: Province; onPick: (p: Province) => void; onYear: (y: number) => void }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const W = Math.max(width, 560)
  const list = useMemo(() => tenures(a), [a])
  const x = d3.scaleLinear().domain([FIRST, NOW]).range([LEFT, W - 8])
  const regions = Object.entries(REGIONS) as [string, readonly Province[]][]
  let y = 22
  const rows: { prov: Province; y: number }[] = []
  const heads: { name: string; y: number }[] = []
  for (const [name, provs] of regions) {
    heads.push({ name, y })
    y += 16
    for (const prov of provs) {
      rows.push({ prov, y })
      y += ROW
    }
    y += GAP - 16
  }
  const H = y
  const years = d3.range(FIRST, Math.floor(NOW) + 1)

  const seg = (t: Tenure, top: number, h: number, i: number) => {
    const x0 = x(Math.max(t.from, FIRST))
    const x1 = Math.max(x0 + 2, x(Math.min(t.to, NOW)) - 1)
    const f = t.p && a.factionIn(t.p, frame)
    const fell = fellAfter(t)
    const fellX = fell ? x(Math.min(Math.max(fy(fell)!, t.from), t.to)) : 0
    return (
      <g
        key={i}
        className={t.p ? 'lg-seg link' : 'lg-seg'}
        onMouseMove={(e) => tip.show(e, <div><b>{t.prov}</b><TenureTip t={t} frame={frame} />{t.derived && <div className="m">据人物履历推得</div>}</div>)}
        onMouseLeave={tip.hide}
        onClick={() => t.p && go(personHref(t.p.id))}
      >
        <rect x={x0} y={top} width={x1 - x0} height={h} rx={1.5} fill={f?.color ?? 'var(--card-2)'} fillOpacity={f ? 0.85 : 1} stroke={f ? 'none' : 'var(--rule-2)'} strokeWidth={0.8} />
        {x1 - x0 > t.name.length * 11 + 6 && h > 9 && (
          <text x={x0 + 4} y={top + h / 2} dy="0.35em" className={f ? 'lg-name on' : 'lg-name'}>
            {t.name}
          </text>
        )}
        {fell && <rect x={fellX - 1.5} y={top - 2} width={3} height={h + 4} fill="var(--seal)" />}
      </g>
    )
  }

  return (
    <div className="ledger" ref={ref}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="诸侯谱：2000 年以来各省书记与行政首长">
        {years.map((yr) => (
          <g key={yr}>
            <line x1={x(yr)} x2={x(yr)} y1={16} y2={H - 4} stroke="var(--rule)" strokeWidth={yr % 5 === 0 ? 1 : 0.5} />
            {yr % 2 === 0 && (
              <text x={x(yr) + 2} y={11} className="lg-year" onClick={() => onYear(yr)}>
                {yr}
              </text>
            )}
          </g>
        ))}
        {heads.map((h) => (
          <text key={h.name} x={0} y={h.y + 10} className="lg-region">
            {h.name}
          </text>
        ))}
        {rows.map(({ prov, y }) => {
          const mine = list.filter((t) => t.prov === prov && t.to > FIRST)
          return (
            <g key={prov} className={pick === prov ? 'lg-row on' : 'lg-row'}>
              <rect x={0} y={y - 2} width={W} height={ROW - 2} fill={pick === prov ? 'var(--paper-2)' : 'transparent'} onClick={() => onPick(prov)} />
              <text x={LEFT - 8} y={y + 9} textAnchor="end" className="lg-prov" onClick={() => onPick(prov)}>
                {prov}
              </text>
              {mine.filter((t) => t.post === 'sec').map((t, i) => seg(t, y, 13, i))}
              {mine.filter((t) => t.post === 'gov').map((t, i) => seg(t, y + 15, 6, i + 100))}
            </g>
          )
        })}
        <line x1={x(year + 0.5)} x2={x(year + 0.5)} y1={14} y2={H - 4} stroke="var(--red)" strokeWidth={1.6} style={{ transition: 'x1 .4s, x2 .4s' }} />
      </svg>
      {tip.node}
    </div>
  )
}

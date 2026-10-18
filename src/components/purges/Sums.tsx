// 金额与刑期: each sentenced official with a known sum, the sum on a log scale against the sentence.
// The 2016 judicial interpretation of the two high courts raised the thresholds for bribery, so the sentences
// before and after it are told apart.
import { scaleLinear, scaleLog } from 'd3'
import { TERMS } from '../../data/schema'
import type { Fall } from '../../lib/purge'
import { go, personHref } from '../../lib/router'
import { useWidth } from '../../lib/useSize'
import { useTip } from '../bits'
import { money } from './Tally'

const SEVERE: Record<string, number> = { life: 23, 'death-suspended': 26, 'death-life': 29, death: 32 }
const severity = (f: Fall) => (f.c.term === 'years' || f.c.term === 'probation' ? (f.c.years ?? 0) : f.c.term === 'exempt' ? 0 : SEVERE[f.c.term!])
const INTERP = '2016-04'
const TICK: Record<number, string> = { 1e6: '100 万元', 1e7: '1000 万元', 1e8: '1 亿元', 1e9: '10 亿元', 1e10: '100 亿元' }

export function Sums({ list }: { list: Fall[] }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const tip = useTip()
  const pts = list.filter((f) => f.c.yuan && f.c.term && severity(f) !== undefined)
  const H = 380
  const pad = { l: 64, r: 16, t: 14, b: 36 }
  const lo = Math.min(1e6, ...pts.map((f) => f.c.yuan!))
  const hi = Math.max(1e9, ...pts.map((f) => f.c.yuan!))
  const x = scaleLog().domain([lo, hi]).range([pad.l, w - pad.r]).nice()
  const y = scaleLinear().domain([0, 33]).range([H - pad.b, pad.t])
  const ticks = [1e6, 1e7, 1e8, 1e9, 1e10].filter((t) => t >= x.domain()[0] && t <= x.domain()[1])
  const later = (f: Fall) => (f.c.sentenced ?? '') >= INTERP
  return (
    <div ref={ref} className="sums">
      <svg width={w} height={H}>
        {[5, 10, 15, 20].map((v) => (
          <g key={v} className="grid-y">
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end">
              {v} 年
            </text>
          </g>
        ))}
        {Object.entries(SEVERE).map(([k, v]) => (
          <g key={k} className="grid-y strong">
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end">
              {k === 'death-life' ? '死缓终身' : TERMS[k as keyof typeof TERMS]}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <g key={t} className="grid-x">
            <line x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b} />
            <text x={x(t)} y={H - pad.b + 18} textAnchor={t === ticks.at(-1) ? 'end' : 'middle'}>
              {TICK[t]}
            </text>
          </g>
        ))}
        {pts.map((f) => {
          // the same sentence stacks: spread fixed terms a little by the month of the sentence
          const jitter = ((f.p.id.charCodeAt(0) + f.p.id.length * 7) % 9) - 4
          return (
            <circle
              key={f.p.id}
              cx={x(f.c.yuan!)}
              cy={y(severity(f)) + (f.c.term === 'years' ? 0 : jitter * 0.9)}
              r={f.level === 'top' ? 6 : 4.2}
              className={later(f) ? 'dot late' : 'dot early'}
              onMouseMove={(e) =>
                tip.show(
                  e,
                  <div className="pg-tip">
                    <b>{f.p.name}</b>
                    <span>{f.p.headline}</span>
                    <span className="m">
                      {money(f.c.yuan!)} · {f.c.term === 'years' ? `有期徒刑 ${f.c.years} 年` : TERMS[f.c.term!]} · {f.c.sentenced?.slice(0, 7)}
                    </span>
                  </div>,
                )
              }
              onMouseLeave={tip.hide}
              onClick={() => go(personHref(f.p.id))}
            />
          )
        })}
      </svg>
      <div className="pg-key">
        <span>
          <i className="dot-key early" />
          二〇一六年四月以前判决
        </span>
        <span>
          <i className="dot-key late" />
          两高《关于办理贪污贿赂刑事案件适用法律若干问题的解释》施行后判决
        </span>
        <span className="m">{pts.length} 人有金额与刑期</span>
      </div>
      {tip.node}
    </div>
  )
}

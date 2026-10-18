// 过程时长: from the first step to the expulsion and to the first sentence, in months, by the year it began.
import { scaleLinear } from 'd3'
import { months, type Fall } from '../../lib/purge'
import { go, personHref } from '../../lib/router'
import { useWidth } from '../../lib/useSize'
import { useTip } from '../bits'

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : undefined
}

export function Durations({ list }: { list: Fall[] }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const tip = useTip()
  const rows = list
    .filter((f) => f.c.on && f.c.on.length >= 7)
    .map((f) => ({
      f,
      exp: f.c.expelled && f.c.expelled.length >= 7 ? months(f.c.on!, f.c.expelled) : undefined,
      sen: f.c.sentenced && f.c.sentenced.length >= 7 ? months(f.c.on!, f.c.sentenced) : undefined,
    }))
    // a zero means the record has only the later step's month, not that it happened at once
    .map((r) => ({ ...r, exp: r.exp && r.exp > 0 ? r.exp : undefined, sen: r.sen && r.sen > 0 ? r.sen : undefined }))
    .filter((r) => r.exp !== undefined || r.sen !== undefined)
  const years = [...new Set(rows.map((r) => Math.floor(r.f.t)))].sort()
  const H = 320
  const pad = { l: 44, r: 12, t: 12, b: 30 }
  const x = scaleLinear().domain([years[0] ?? 2012, (years.at(-1) ?? 2026) + 1]).range([pad.l, w - pad.r])
  const top = Math.min(96, Math.max(36, ...rows.map((r) => r.sen ?? r.exp ?? 0)))
  const y = scaleLinear().domain([0, top]).range([H - pad.b, pad.t])
  const med = years.map((yr) => ({ yr, exp: median(rows.filter((r) => Math.floor(r.f.t) === yr && r.exp !== undefined).map((r) => r.exp!)), sen: median(rows.filter((r) => Math.floor(r.f.t) === yr && r.sen !== undefined).map((r) => r.sen!)) }))
  const show = (e: React.MouseEvent, r: (typeof rows)[number]) =>
    tip.show(
      e,
      <div className="pg-tip">
        <b>{r.f.p.name}</b>
        <span className="m">第一步 {r.f.c.on}</span>
        {r.exp !== undefined && <span>{r.exp} 个月后开除</span>}
        {r.sen !== undefined && <span>{r.sen} 个月后一审判决</span>}
      </div>,
    )
  return (
    <div ref={ref} className="durations">
      <svg width={w} height={H}>
        {[0, 12, 24, 36, 48, 60, 72, 84, 96].filter((v) => v <= top).map((v) => (
          <g key={v} className="grid-y">
            <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} />
            <text x={pad.l - 6} y={y(v) + 4} textAnchor="end">
              {v ? `${v / 12} 年` : '0'}
            </text>
          </g>
        ))}
        {years.map((yr) => (
          <text key={yr} className="axis-x" x={x(yr + 0.5)} y={H - pad.b + 18} textAnchor="middle">
            {yr}
          </text>
        ))}
        {rows.map((r) => {
          const cx = x(r.f.t)
          return (
            <g key={r.f.p.id} onMouseMove={(e) => show(e, r)} onMouseLeave={tip.hide} onClick={() => go(personHref(r.f.p.id))} className="dur">
              {r.exp !== undefined && <circle cx={cx} cy={y(Math.min(r.exp, top))} r={3.2} className="exp" />}
              {r.sen !== undefined && <circle cx={cx} cy={y(Math.min(r.sen, top))} r={3.6} className="sen" />}
            </g>
          )
        })}
        {med.map(
          (m) =>
            m.sen !== undefined && (
              <line key={`s${m.yr}`} className="med sen" x1={x(m.yr) + 4} x2={x(m.yr + 1) - 4} y1={y(m.sen)} y2={y(m.sen)} />
            ),
        )}
        {med.map(
          (m) =>
            m.exp !== undefined && (
              <line key={`e${m.yr}`} className="med exp" x1={x(m.yr) + 4} x2={x(m.yr + 1) - 4} y1={y(m.exp)} y2={y(m.exp)} />
            ),
        )}
      </svg>
      <div className="pg-key">
        <span>
          <i className="dot-key exp" />
          到开除党籍
        </span>
        <span>
          <i className="dot-key sen" />
          到一审判决
        </span>
        <span className="m">横线为当年中位数；只计日期精确到月的</span>
      </div>
      {tip.node}
    </div>
  )
}

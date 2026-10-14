// Analysis charts embedded in the faction pages (decisions #20): seat share by congress and the
// "seven up, eight down" retirement-age scatter.
import { scaleLinear } from 'd3'
import type { Atlas, PersonR } from '../data/db'
import type { Frame } from '../data/schema'
import { age } from '../lib/dates'
import { cnNum } from '../lib/cn'
import { go, personHref } from '../lib/router'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'
import { useTip } from './bits'

const politburo = (a: Atlas, n: number): PersonR[] => {
  const c = a.congress.get(n)
  if (!c) return []
  return [...c.psc, ...c.pb].map((id) => a.person.get(id)).filter((p): p is PersonR => !!p)
}

// stacked bars: the full politburo of each congress by faction in one frame
export function SeatShare({ frame, highlight }: { frame: Frame; highlight?: string }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, w] = useWidth<HTMLDivElement>()
  const rows = a.db.congresses.map((c) => {
    const ppl = politburo(a, c.n)
    const groups = new Map<string, { id: string; name: string; color: string; ppl: PersonR[] }>()
    for (const p of ppl) {
      const f = a.factionIn(p, frame)
      const k = f?.id ?? '-'
      const g = groups.get(k) ?? { id: k, name: f?.name ?? '未标注', color: f?.color ?? 'var(--rule-2)', ppl: [] }
      g.ppl.push(p)
      groups.set(k, g)
    }
    const segs = [...groups.values()].sort((x, y) => (x.id === '-' ? 1 : y.id === '-' ? -1 : y.ppl.length - x.ppl.length))
    return { n: c.n, total: ppl.length, segs }
  })
  const max = Math.max(...rows.map((r) => r.total), 1)
  const left = 54
  const x = scaleLinear().domain([0, max]).range([0, Math.max(w - left - 40, 100)])
  const RH = 30
  return (
    <div ref={ref}>
      <svg className="share" width={w} height={rows.length * (RH + 8)}>
        {rows.map((r, i) => {
          let acc = 0
          return (
            <g key={r.n} transform={`translate(0, ${i * (RH + 8)})`}>
              <text x={0} y={RH / 2 + 4} style={{ fontWeight: 700 }}>
                {cnNum(r.n)}届
              </text>
              {r.segs.map((s) => {
                const x0 = left + x(acc)
                acc += s.ppl.length
                const dim = highlight && s.id !== highlight
                return (
                  <g
                    key={s.id}
                    onMouseMove={(e) => tip.show(e, <><b>{s.name}</b> <span className="m">{s.ppl.length} 人</span><div>{s.ppl.map((p) => p.name).join('、')}</div></>)}
                    onMouseLeave={tip.hide}
                    onClick={() => s.id !== '-' && go(`#/factions/${s.id}`)}
                    style={{ cursor: s.id !== '-' ? 'pointer' : undefined }}
                  >
                    <rect x={x0} y={0} width={Math.max(x(s.ppl.length) - 2, 1)} height={RH} rx={5} fill={s.color} opacity={dim ? 0.18 : 0.92} />
                    {x(s.ppl.length) > 22 && (
                      <text x={x0 + x(s.ppl.length) / 2 - 1} y={RH / 2 + 4} textAnchor="middle" style={{ fill: s.id === '-' ? 'var(--ink-2)' : '#fff', fontWeight: 700 }}>
                        {s.ppl.length}
                      </text>
                    )}
                  </g>
                )
              })}
              <text x={left + x(r.total) + 6} y={RH / 2 + 4} className="muted">
                {r.total}
              </text>
            </g>
          )
        })}
      </svg>
      {tip.node}
    </div>
  )
}

type Fate = 'stay' | 'retire' | 'fell'
const FATE: Record<Fate, [string, string]> = {
  stay: ['留任或升任', 'var(--jade)'],
  retire: ['退出', 'var(--muted)'],
  fell: ['落马', 'var(--red)'],
}

// every politburo member of congress n-1 at the opening of congress n: age against outcome
export function AgeRule() {
  const a = useAtlas()
  const tip = useTip()
  const [ref, w] = useWidth<HTMLDivElement>()
  const cs = a.db.congresses.filter((c) => a.congress.has(c.n - 1))
  const dots = cs.flatMap((c) => {
    const now = new Set([...c.psc, ...c.pb])
    const prev = a.congress.get(c.n - 1)!
    const left = new Set(prev.changes.filter((x) => x.kind !== 'in').map((x) => x.person))
    return politburo(a, c.n - 1)
      .filter((p) => p.born && (!left.has(p.id) || p.fall.length))
      .map((p, i) => {
        const fell = p.fall.some((f) => f.date <= c.opened) || (left.has(p.id) && p.fall.length > 0)
        const fate: Fate = now.has(p.id) ? 'stay' : fell ? 'fell' : 'retire'
        return { p, n: c.n, at: age(p.born, c.opened)!, fate, i }
      })
  })
  if (!dots.length) return null
  const H = 360
  const ages = dots.map((d) => d.at)
  const y = scaleLinear().domain([Math.min(55, ...ages) - 1, Math.max(72, ...ages) + 1]).range([H - 30, 14])
  const x = scaleLinear().domain([cs[0].n - 0.5, cs[cs.length - 1].n + 0.5]).range([44, Math.max(w - 12, 300)])
  const colW = (x(1) - x(0)) * 0.7
  return (
    <div ref={ref}>
      <svg className="share" width={w} height={H}>
        {[55, 60, 65, 70].filter((t) => t > y.domain()[0] && t < y.domain()[1]).map((t) => (
          <g key={t}>
            <line x1={44} x2={w} y1={y(t)} y2={y(t)} stroke="var(--rule)" />
            <text x={36} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        <rect x={44} y={y(67.5) - 0.5} width={Math.max(w - 44, 0)} height={1.5} fill="var(--red)" opacity={0.7} />
        <text x={w - 6} y={y(67.5) - 6} textAnchor="end" style={{ fill: 'var(--red)', fontWeight: 700 }}>
          七上八下：67 留，68 下
        </text>
        {cs.map((c) => (
          <text key={c.n} x={x(c.n)} y={H - 8} textAnchor="middle" style={{ fontWeight: 700 }}>
            {cnNum(c.n)}大 · {c.opened.slice(0, 4)}
          </text>
        ))}
        {dots.map((d) => {
          const same = dots.filter((o) => o.n === d.n && o.at === d.at)
          const k = same.indexOf(d)
          const dx = (k - (same.length - 1) / 2) * 13
          return (
            <circle
              key={`${d.n}-${d.p.id}`}
              cx={x(d.n) + Math.max(Math.min(dx, colW / 2), -colW / 2)}
              cy={y(d.at)}
              r={5.5}
              fill={FATE[d.fate][1]}
              stroke="var(--card)"
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onClick={() => go(personHref(d.p.id))}
              onMouseMove={(e) => tip.show(e, <><b>{d.p.name}</b> <span className="m">{d.at} 岁 · {FATE[d.fate][0]}</span></>)}
              onMouseLeave={tip.hide}
            />
          )
        })}
      </svg>
      <div className="legend">
        {Object.values(FATE).map(([l, c]) => (
          <span key={l}>
            <i style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
      {tip.node}
    </div>
  )
}

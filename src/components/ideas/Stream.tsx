// 主义词频: how often each ism's terms appear per 10 000 characters, year by year, in the official texts or in
// the 人民日报 editorial sample. Years with too little text are left out.
import * as d3 from 'd3'
import { useMemo } from 'react'
import { useKept } from '../../lib/router'
import type { CorpusR } from '../../data/db'
import { ISM_KINDS, type Ism, type IsmKind } from '../../data/schema'
import { ismColor } from '../../lib/isms'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { useTip } from '../bits'

const SETS: [string, string, CorpusR['kind'][]][] = [
  ['official', '官方文件', ['congress', 'gov', 'plenum', 'resolution', 'charter', 'constitution']],
  ['editorial', '人民日报社论', ['editorial']],
  ['qiushi', '求是', ['qiushi']],
]
const TOP = 14
const MIN_CHARS = 8000
const H = 340
// shades within a kind, so neighbouring layers of one kind can be told apart
const SHADES = [0, 0.18, -0.16, 0.32, -0.3, 0.45]

export function Stream({ pick, onPick }: { pick: string | null; onPick: (id: string | null) => void }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [set, setSet] = useKept('official')
  const avail = SETS.filter(([, , kinds]) => a.db.corpus.some((d) => kinds.includes(d.kind)))

  const { years, isms, rate } = useMemo(() => {
    const kinds = SETS.find((s) => s[0] === set)![2]
    const byYear = d3.rollup(
      a.db.corpus.filter((d) => kinds.includes(d.kind)),
      (ds) => ({ chars: d3.sum(ds, (d) => d.chars), n: (id: string) => d3.sum(ds, (d) => d.isms?.[id] ?? 0) }),
      (d) => Number(d.date.slice(0, 4)),
    )
    const years = [...byYear.keys()].filter((y) => byYear.get(y)!.chars >= MIN_CHARS).sort((p, q) => p - q)
    const rate = (id: string, y: number) => {
      const b = byYear.get(y)!
      return b.chars ? (b.n(id) * 10000) / b.chars : 0
    }
    const isms = a.db.isms
      .map((m) => ({ m, total: d3.sum(years, (y) => rate(m.id, y)) }))
      .filter((r) => r.total > 0)
      .sort((p, q) => q.total - p.total)
      .slice(0, TOP)
      .map((r) => r.m)
    return { years, isms, rate }
  }, [a, set])

  if (!a.db.isms.length) return <div className="empty">主义条目尚在整理</div>
  const W = Math.max(width, 560)
  const rows = years.map((y) => Object.fromEntries([['year', y], ...isms.map((m) => [m.id, rate(m.id, y)])]) as Record<string, number>)
  const stack = d3.stack<Record<string, number>>().keys(isms.map((m) => m.id)).offset(d3.stackOffsetWiggle).order(d3.stackOrderInsideOut)(rows)
  const x = d3.scaleLinear().domain(d3.extent(years) as [number, number]).range([16, W - 16])
  const lo = d3.min(stack, (s) => d3.min(s, (d) => d[0])) ?? 0
  const hi = d3.max(stack, (s) => d3.max(s, (d) => d[1])) ?? 1
  const y = d3.scaleLinear().domain([lo, hi]).range([H - 26, 8])
  const area = d3.area<d3.SeriesPoint<Record<string, number>>>().x((d) => x(d.data.year)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(d3.curveBasis)
  const seen = new Map<IsmKind, number>()
  const shade = new Map<string, number>()
  for (const m of isms) {
    const k = seen.get(m.kind) ?? 0
    seen.set(m.kind, k + 1)
    shade.set(m.id, SHADES[k % SHADES.length])
  }
  const fill = (m: Ism) => {
    const s = shade.get(m.id)!
    return s >= 0 ? `color-mix(in oklab, ${ismColor(m.kind)} ${100 - s * 100}%, white)` : `color-mix(in oklab, ${ismColor(m.kind)} ${100 + s * 100}%, black)`
  }

  return (
    <div className="card pad stream-v" ref={ref}>
      {avail.length > 1 && (
        <div className="seg" style={{ marginBottom: 10 }}>
          {avail.map(([k, l]) => (
            <button key={k} className={k === set ? 'on' : undefined} onClick={() => setSet(k)}>
              {l}
            </button>
          ))}
        </div>
      )}
      {!years.length || !isms.length ? (
        <div className="empty">这组文献里还没有主义词的出现</div>
      ) : (
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="主义词频">
          {x.ticks(Math.floor(W / 90)).map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={8} y2={H - 26} stroke="var(--rule)" />
              <text x={x(t)} y={H - 8} textAnchor="middle" className="cw-tick">
                {t}
              </text>
            </g>
          ))}
          {stack.map((s, i) => {
            const m = isms[i]
            const on = !pick || pick === m.id
            const best = s.reduce((b, d) => (d[1] - d[0] > b[1] - b[0] ? d : b), s[0])
            const thick = y(best[0]) - y(best[1])
            return (
              <g key={m.id} className="st-layer" onClick={() => onPick(pick === m.id ? null : m.id)}>
                <path
                  d={area(s)!}
                  fill={fill(m)}
                  fillOpacity={on ? 0.88 : 0.15}
                  stroke="var(--card)"
                  strokeWidth={0.6}
                  onMouseMove={(e) => {
                    const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect()
                    const yr = x.invert(((e.clientX - box.left) / box.width) * W)
                    const at = years.reduce((b, v) => (Math.abs(v - yr) < Math.abs(b - yr) ? v : b), years[0])
                    tip.show(e, <><b>{m.name}</b><div className="m">{ISM_KINDS[m.kind]}</div><div>{at} 年：每万字 {rate(m.id, at).toFixed(2)} 次</div></>)
                  }}
                  onMouseLeave={tip.hide}
                />
                {thick > 15 && (
                  <text x={x(best.data.year)} y={(y(best[0]) + y(best[1])) / 2} dy="0.35em" textAnchor="middle" className="st-name" pointerEvents="none">
                    {m.short ?? m.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}
      <div className="legend small">
        <span className="muted">层厚＝该年每万字出现次数（取总频率最高的 {isms.length} 个主义）；字数不足的年份不画；点击层看详情</span>
      </div>
      {tip.node}
    </div>
  )
}

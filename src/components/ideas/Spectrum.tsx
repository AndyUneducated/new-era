// 思想光谱漂移: two of the three axes at a time; the red path is the central line up to the chosen moment,
// the dots are the isms alive then. Positions are the editor's judgment of relative stance (decisions #26).
import * as d3 from 'd3'
import { useEffect, useMemo, useState } from 'react'
import { AXES, ISM_KINDS, type Axis } from '../../data/schema'
import { fmt, fy } from '../../lib/dates'
import { NOW } from '../../lib/faction'
import { describe, FIRST_YEAR, ismColor, KIND_ORDER, lineUntil, posAt, track } from '../../lib/isms'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { useTip } from '../bits'

const PLANES: [Axis, Axis][] = [
  ['x', 'y'],
  ['x', 'z'],
  ['z', 'y'],
]
const PAD = 40
const LABELLED = 4

export function Spectrum({ pick, onPick }: { pick: string | null; onPick: (id: string | null) => void }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [plane, setPlane] = useState(0)
  const [t, setT] = useState(Math.floor(NOW))
  const [playing, setPlaying] = useState(false)
  const [h, v] = PLANES[plane]

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => (t >= NOW ? setPlaying(false) : setT((u) => Math.min(NOW, u + 0.25))), 90)
    return () => clearTimeout(id)
  }, [playing, t])

  const side = width >= 900 ? 280 : 0
  const S = Math.max(300, Math.min(width - side - 24, 660))
  const sc = d3.scaleLinear().domain([-1, 1]).range([PAD, S - PAD])
  const X = (p: Record<Axis, number>) => sc(p[h])
  const Y = (p: Record<Axis, number>) => S - sc(p[v])

  const line = a.db.line
  const past = lineUntil(line, t)
  const now = track(line, t)
  const last = line.findLastIndex((p) => fy(p.at)! <= t)
  const alive = useMemo(
    () =>
      a.db.isms
        .map((m) => ({ m, p: posAt(m, t) }))
        .filter((r): r is { m: (typeof r)['m']; p: NonNullable<(typeof r)['p']> } => !!r.p)
        .sort((p, q) => KIND_ORDER.indexOf(p.m.kind) - KIND_ORDER.indexOf(q.m.kind)),
    [a, t],
  )
  if (!a.db.isms.length && !line.length) return <div className="empty">光谱数据尚在整理</div>
  const pts = (ps: Record<Axis, number>[]) => ps.map((p) => `${X(p)},${Y(p)}`).join(' ')
  const focus = pick ? a.ism.get(pick) : undefined

  return (
    <div className="card pad spectrum-v" ref={ref}>
      <div className="galaxy-bar">
        <button
          className="chip"
          onClick={() => {
            if (!playing && t >= NOW - 0.01) setT(FIRST_YEAR)
            setPlaying(!playing)
          }}
        >
          {playing ? '❚❚ 暂停' : '▶ 播放'}
        </button>
        <input type="range" min={FIRST_YEAR} max={NOW} step={0.25} value={t} onChange={(e) => { setPlaying(false); setT(Number(e.target.value)) }} aria-label="年份" style={{ accentColor: 'var(--red)' }} />
        <b className="tnum galaxy-year" style={{ color: 'var(--red)' }}>{Math.floor(t)}</b>
        <div className="seg">
          {PLANES.map(([p, q], i) => (
            <button key={i} className={i === plane ? 'on' : undefined} onClick={() => setPlane(i)}>
              {AXES[p].name} × {AXES[q].name}
            </button>
          ))}
        </div>
      </div>
      <div className="spectrum-body">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ flex: 'none', maxWidth: '100%' }} role="img" aria-label="思想光谱">
          <rect x={PAD} y={PAD} width={S - 2 * PAD} height={S - 2 * PAD} rx={14} fill="var(--card-2)" stroke="var(--rule-2)" />
          {[-0.5, 0, 0.5].map((u) => (
            <g key={u} stroke={u ? 'var(--rule)' : 'var(--rule-2)'} strokeDasharray={u ? '2 4' : undefined}>
              <line x1={sc(u)} x2={sc(u)} y1={PAD} y2={S - PAD} />
              <line y1={S - sc(u)} y2={S - sc(u)} x1={PAD} x2={S - PAD} />
            </g>
          ))}
          <g className="sp-axis">
            <text x={PAD} y={S - PAD + 18}>← {AXES[h].ends[0]}</text>
            <text x={S - PAD} y={S - PAD + 18} textAnchor="end">{AXES[h].ends[1]} →</text>
            <text transform={`translate(${PAD - 12},${S - PAD}) rotate(-90)`}>← {AXES[v].ends[0]}</text>
            <text transform={`translate(${PAD - 12},${PAD}) rotate(-90)`} textAnchor="end">{AXES[v].ends[1]} →</text>
          </g>
          {line.length > 1 && <polyline points={pts(line)} fill="none" stroke="var(--red)" strokeOpacity={0.12} />}
          {past.length > 1 && <polyline points={pts(past)} fill="none" stroke="var(--red)" strokeOpacity={0.8} strokeWidth={2} strokeLinejoin="round" className="sp-line" />}
          {line.map((p, i) => {
            const done = fy(p.at)! <= t
            const recent = done && i > last - LABELLED
            return (
              <g
                key={p.at + p.label}
                className="sp-dot"
                style={{ transform: `translate(${X(p)}px,${Y(p)}px)` }}
                opacity={done ? 1 : 0.2}
                onMouseMove={(e) => tip.show(e, <><b>中央路线 · {p.label}</b><div className="m">{fmt(p.at)} · {describe(p)}</div>{p.note && <div style={{ marginTop: 4, maxWidth: 300 }}>{p.note}</div>}</>)}
                onMouseLeave={tip.hide}
              >
                <circle r={3} fill="var(--red)" />
                {recent && (
                  <text x={X(p) > S * 0.72 ? -6 : 6} y={i % 2 ? 12 : -5} textAnchor={X(p) > S * 0.72 ? 'end' : 'start'} className={`sp-turn${i === last ? ' on' : ''}`}>
                    {p.at.slice(0, 4)} {p.label}
                  </text>
                )}
              </g>
            )
          })}
          {focus && focus.pos.length > 1 && <polyline points={pts(focus.pos)} fill="none" stroke={ismColor(focus.kind)} strokeWidth={1.5} strokeDasharray="3 3" />}
          {alive.map(({ m, p }) => (
            <g
              key={m.id}
              className="sp-ism"
              style={{ transform: `translate(${X(p)}px,${Y(p)}px)` }}
              onClick={() => onPick(pick === m.id ? null : m.id)}
              onMouseMove={(e) => tip.show(e, <><b>{m.name}</b><div className="m">{ISM_KINDS[m.kind]}</div><div style={{ marginTop: 4 }}>{describe(p)}</div>{m.kind === 'label' && <div className="m">罪名：位置是批判者对被批判者的描述</div>}</>)}
              onMouseLeave={tip.hide}
            >
              <circle r={pick === m.id ? 8 : 6} fill={m.kind === 'label' ? 'var(--card)' : ismColor(m.kind)} stroke={ismColor(m.kind)} strokeWidth={m.kind === 'label' ? 2 : 1} strokeDasharray={m.kind === 'label' ? '2 1.5' : undefined} fillOpacity={0.85} />
              <text x={X(p) > S * 0.72 ? -9 : 9} y={4} textAnchor={X(p) > S * 0.72 ? 'end' : 'start'} className={`sp-name${pick === m.id ? ' on' : ''}`}>
                {m.short ?? m.name}
              </text>
            </g>
          ))}
          {now && t >= fy(line[0].at)! && (
            <g pointerEvents="none" className="sp-dot" style={{ transform: `translate(${X(now)}px,${Y(now)}px)` }}>
              <circle r={10} fill="none" stroke="var(--red)" strokeWidth={2} />
              <circle r={4} fill="var(--red)" />
            </g>
          )}
        </svg>
        {side > 0 && (
          <aside className="spectrum-side">
            <h3>{Math.floor(t)} 年</h3>
            {now && last >= 0 ? (
              <p>
                <b style={{ color: 'var(--red)' }}>中央路线</b>：{line[last].label}之后，{describe(now)}。
              </p>
            ) : (
              <p className="muted small">把时间轴移到 {line[0]?.at.slice(0, 4) ?? FIRST_YEAR} 年之后。</p>
            )}
            <h4>此刻存在的主张（{alive.length}）</h4>
            <ul>
              {alive.map(({ m }) => (
                <li key={m.id}>
                  <button className={`linklike${pick === m.id ? ' on' : ''}`} onClick={() => onPick(pick === m.id ? null : m.id)}>
                    <i style={{ background: ismColor(m.kind) }} />
                    {m.short ?? m.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
      <div className="legend small">
        {KIND_ORDER.map((k) => (
          <span key={k}>
            <i style={k === 'label' ? { border: `1.5px dashed ${ismColor(k)}` } : { background: ismColor(k) }} />
            {ISM_KINDS[k]}
          </span>
        ))}
        <span className="muted">位置是编者对相对立场的判断，不是测量</span>
      </div>
      {tip.node}
    </div>
  )
}

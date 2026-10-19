// A faction as concentric rings around its patron: elders, core, backbone, periphery (decisions #22, #24).
// The year control lights up who held office that year and greys out who had fallen by then.
import { useEffect, useMemo, useState } from 'react'
import type { PersonR } from '../data/db'
import { RANKS, RELATIONS, type Faction } from '../data/schema'
import { activeIn, centre, fallYear, level, membersOf, NOW, RING_ORDER, type Member } from '../lib/faction'
import { quoted } from '../lib/quotes'
import { go, personHref, useKept } from '../lib/router'
import { useAtlas } from '../state'
import { RumorMark, Src, useTip } from './bits'
import { Face, fallen } from './Face'

const FIRST = 2000
const LAST = Math.floor(NOW)
const R0 = 120
const STEP = 92
const MAXR = 330
const LANE = 22
const GAP = 70
const SIZE: Record<number, number> = { 4: 21, 3: 17, 2: 13.5, 1: 11 }
const BY: Record<Member['rankBy'], string> = { source: '来源原句', editor: '编者归类', auto: '未标注分层，按最高职级暂放' }

interface Placed { m: Member; x: number; y: number; r: number; ring: number }

// Each ring grows until its people fit (face or name, whichever is wider), leaving the top clear for the
// ring's label. Past MAXR a ring splits into two staggered lanes; past that the faces shrink.
function place(rings: Member[][], lv: (p: PersonR) => number) {
  const out: Placed[] = []
  const radii: number[] = []
  let outer = R0 - STEP
  rings.forEach((list) => {
    if (!list.length) {
      radii.push(0)
      return
    }
    const sized = list.map((m) => {
      const r = SIZE[lv(m.p)]
      return { m, r, w: Math.max(2 * r + 12, m.p.name.length * 12 + 12) }
    })
    const need = sized.reduce((s, x) => s + x.w, 0) + GAP
    let lanes = 1
    let base = Math.max(outer + STEP, need / (2 * Math.PI))
    if (base > MAXR) {
      lanes = 2
      base = Math.max(outer + STEP + LANE, Math.min(MAXR, need / 2 / (2 * Math.PI)))
    }
    const room = lanes * 2 * Math.PI * base
    const shrink = Math.min(1, room / need)
    radii.push(base)
    const span = 2 * Math.PI - GAP / base
    const total = need - GAP
    let at = -Math.PI / 2 + GAP / base / 2
    sized.forEach((s, i) => {
      const t = at + ((s.w / total) * span) / 2
      at += (s.w / total) * span
      const rr = lanes === 2 ? base + (i % 2 ? LANE : -LANE) : base
      out.push({ m: s.m, x: rr * Math.cos(t), y: rr * Math.sin(t), r: s.r * shrink, ring: radii.length - 1 })
    })
    outer = base + (lanes === 2 ? LANE : 0)
  })
  return { out, radii }
}

// names point away from the centre so that neighbours stacked down the sides of a ring do not collide
function Label({ n }: { n: Placed }) {
  const d = Math.hypot(n.x, n.y) || 1
  const ux = n.x / d
  const uy = n.y / d
  const side = Math.abs(ux) > 0.4
  const pad = n.r + 6
  return side ? (
    <text x={ux * pad} y={uy * pad + 4} textAnchor={ux > 0 ? 'start' : 'end'} className="gx-name">
      {n.m.p.name}
    </text>
  ) : (
    <text y={uy > 0 ? n.r + 14 : -n.r - 7} textAnchor="middle" className="gx-name">
      {n.m.p.name}
    </text>
  )
}

export function Galaxy({ f }: { f: Faction }) {
  const a = useAtlas()
  const tip = useTip()
  const [year, setYear] = useKept<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const members = useMemo(() => membersOf(a, f), [a, f])
  const mid = centre(f)
  const hub = mid ? a.person.get(mid) : undefined
  const lv = (p: PersonR) => level(a, p)
  const rings = RING_ORDER.map((r) => members.filter((m) => m.rank === r).sort((x, y) => lv(y.p) - lv(x.p) || x.p.name.localeCompare(y.p.name, 'zh')))
  const { out, radii } = place(rings, lv)
  const at = new Map(out.map((n) => [n.m.p.id, n]))
  if (hub) at.set(hub.id, { m: { p: hub, tags: [], rank: 'core', rankBy: 'auto' }, x: 0, y: 0, r: 46, ring: -1 })
  const ids = new Set(at.keys())
  const ties = a.db.relations.filter((r) => ids.has(r.a) && ids.has(r.b))
  const half = Math.max(...radii, R0) + 58

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => (year !== null && year >= LAST ? setPlaying(false) : setYear((y) => (y ?? FIRST - 1) + 1)), 650)
    return () => clearTimeout(t)
  }, [playing, year])

  const state = (p: PersonR) => {
    if (year === null) return { on: true, grey: fallen(p), mark: undefined }
    const fy = fallYear(p)
    const down = fy !== undefined && fy <= year + 1
    return { on: activeIn(a, p, year) && !down, grey: down, mark: down ? ('fell' as const) : null }
  }
  const lit = year === null ? members.length : members.filter((m) => state(m.p).on).length
  const near = hover ? new Set(ties.filter((t) => t.a === hover || t.b === hover).flatMap((t) => [t.a, t.b])) : null

  const show = (e: React.MouseEvent, n: Placed) => {
    const { m } = n
    tip.show(
      e,
      <>
        <b>{m.p.name}</b>
        <div className="m">{m.p.headline}</div>
        {n.ring >= 0 && (
          <div style={{ marginTop: 6 }}>
            <b style={{ color: f.color }}>{RANKS[m.rank]}</b> <span className="m">· {BY[m.rankBy]}</span>
            {m.rankTag?.rankQuote && <div style={{ marginTop: 3 }}>{quoted(m.rankTag.rankQuote)}</div>}
          </div>
        )}
        {m.tags.slice(0, 2).map((t, i) => (
          <div key={i} style={{ marginTop: 4 }} className="m">
            <RumorMark cite={t.cite} />
            {t.quote ? quoted(t.quote).slice(0, 70) + (t.quote.length > 68 ? '…' : '') : ''} <Src cite={t.cite} />
          </div>
        ))}
        {ties
          .filter((t) => t.a === m.p.id || t.b === m.p.id)
          .slice(0, 3)
          .map((t, i) => (
            <div key={`r${i}`} style={{ marginTop: 4 }}>
              <b>{RELATIONS[t.kind]}</b> {a.name(t.a === m.p.id ? t.b : t.a)}
            </div>
          ))}
      </>,
    )
    setHover(m.p.id)
  }
  const leave = () => {
    tip.hide()
    setHover(null)
  }

  return (
    <div className="card pad galaxy">
      <div className="galaxy-bar">
        <button className={`chip${year === null ? ' on' : ''}`} onClick={() => { setPlaying(false); setYear(null) }}>全部</button>
        <button
          className="chip"
          onClick={() => {
            if (!playing && (year === null || year >= LAST)) setYear(FIRST)
            setPlaying(!playing)
          }}
          aria-label={playing ? '暂停' : '逐年播放'}
        >
          {playing ? '❚❚ 暂停' : '▶ 逐年播放'}
        </button>
        <input type="range" min={FIRST} max={LAST} value={year ?? LAST} onChange={(e) => { setPlaying(false); setYear(Number(e.target.value)) }} aria-label="年份" style={{ accentColor: f.color }} />
        <b className="tnum galaxy-year" style={{ color: year === null ? 'var(--muted)' : f.color }}>{year ?? '历年'}</b>
        <span className="small muted">{year === null ? `${members.length + (hub ? 1 : 0)} 人` : `${year} 年在任 ${lit} 人`}</span>
      </div>
      <svg viewBox={`${-half} ${-half} ${2 * half} ${2 * half}`} role="img" aria-label={`${f.name}的成员分层`}>
        <defs>
          {out.map((n) => (
            <clipPath key={n.m.p.id} id={`gx-${n.m.p.id}`}>
              <circle r={n.r} />
            </clipPath>
          ))}
          <clipPath id="gx-hub">
            <circle r={46} />
          </clipPath>
          <radialGradient id={`gx-glow-${f.id}`}>
            <stop offset="0%" stopColor={f.color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={f.color} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle r={half - 20} fill={`url(#gx-glow-${f.id})`} />
        {radii.map((r, i) =>
          r ? (
            <g key={i}>
              <circle r={r} fill="none" stroke={f.color} strokeOpacity={0.28} strokeDasharray={i === 3 ? '2 6' : undefined} />
              <text y={-r + 4} textAnchor="middle" className="gx-ring">
                {RANKS[RING_ORDER[i]]} {rings[i].length}
              </text>
            </g>
          ) : null,
        )}
        {ties.map((t, i) => {
          const p = at.get(t.a)!
          const q = at.get(t.b)!
          const on = !near || (near.has(t.a) && near.has(t.b) && (t.a === hover || t.b === hover))
          return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={t.kind === 'rival' ? 'var(--muted)' : f.color} strokeWidth={t.kind === 'patron' || t.kind === 'secretary' ? 1.8 : 1} strokeDasharray={t.kind === 'colleague' ? '3 4' : undefined} opacity={on ? 0.55 : 0.06} />
        })}
        {out.map((n) => {
          const s = state(n.m.p)
          const dim = (!s.on && year !== null) || (near && !near.has(n.m.p.id) && n.m.p.id !== hover)
          return (
            <g
              key={n.m.p.id}
              className="gx-node"
              transform={`translate(${n.x},${n.y})`}
              opacity={dim ? 0.18 : 1}
              onMouseMove={(e) => show(e, n)}
              onMouseLeave={leave}
              onClick={() => go(personHref(n.m.p.id))}
              role="link"
              tabIndex={0}
              aria-label={`${n.m.p.name}，${RANKS[n.m.rank]}`}
              onKeyDown={(e) => e.key === 'Enter' && go(personHref(n.m.p.id))}
            >
              <circle r={n.r + 2.5} fill={s.grey ? 'var(--rule-2)' : f.color} />
              <Face p={n.m.p} r={n.r} clip={`gx-${n.m.p.id}`} mark={s.mark} />
              {n.m.rankBy === 'auto' && <circle r={n.r + 5} fill="none" stroke="var(--muted)" strokeWidth={0.8} strokeDasharray="1 3" />}
              {n.r >= 8 && <Label n={n} />}
            </g>
          )
        })}
        {hub ? (
          <g className="gx-node" onClick={() => go(personHref(hub.id))} onMouseMove={(e) => show(e, at.get(hub.id)!)} onMouseLeave={leave} role="link" tabIndex={0} aria-label={hub.name}>
            <circle r={52} fill="none" stroke={f.color} strokeWidth={3} />
            <Face p={hub} r={46} clip="gx-hub" mark={state(hub).mark} />
            <text y={70} textAnchor="middle" className="gx-hub-name">
              {hub.name}
            </text>
          </g>
        ) : (
          <g>
            <circle r={44} fill={f.color} />
            <text textAnchor="middle" dy="0.36em" fontSize={40} fontFamily="var(--serif)" fontWeight={900} fill="#fff">
              {f.name.slice(0, 1)}
            </text>
          </g>
        )}
      </svg>
      <div className="legend small">
        <span>
          <i style={{ background: f.color }} />
          {f.patron ? '中心为恩主' : '中心为首位核心人物'}
        </span>
        <span>头像大小＝最高职级</span>
        <span>灰色＝已落马</span>
        <span>
          <i className="dotted" />
          虚圈＝未标注分层，按职级暂放
        </span>
        {ties.length > 0 && <span>连线＝提携、秘书（实线）与共事（虚线）</span>}
      </div>
      {tip.node}
    </div>
  )
}

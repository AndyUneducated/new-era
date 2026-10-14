// Where the people of one frame's factions sit under another frame: a two-column flow, one band per pair of
// factions that name the same people. Someone named by two factions on a side is counted in each.
import { useMemo, useState } from 'react'
import type { Faction, Frame } from '../data/schema'
import { FRAMES } from '../data/schema'
import { peopleIn, shortName } from '../lib/faction'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'
import { useTip } from './bits'

const PAIRS: [Frame, Frame][] = [
  ['classic', 'xi'],
  ['binary', 'xi'],
  ['classic', 'army'],
  ['xi', 'purged'],
  ['classic', 'purged'],
]
const NONE = '未归派'
const BAR = 12
const GAP = 10
const PX = 3.2

interface Side { key: string; name: string; color: string; f?: Faction; y0: number; y1: number; n: number }
interface Band { l: number; r: number; who: string[]; ly: number; ry: number; h: number }

export function FrameFlow() {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [pick, setPick] = useState(0)
  const [hover, setHover] = useState<{ side: 'l' | 'r'; i: number } | null>(null)
  const [A, B] = PAIRS[pick]

  const { left, right, bands, H } = useMemo(() => {
    const side = (fr: Frame) => {
      const fs = a.db.factions.filter((f) => f.frame === fr)
      return { fs, sets: fs.map((f) => new Set(peopleIn(a, f))) }
    }
    const L = side(A)
    const R = side(B)
    const everyone = new Set([...L.sets, ...R.sets].flatMap((s) => [...s]))
    const pairs = new Map<string, string[]>()
    for (const id of everyone) {
      const ls = L.sets.flatMap((s, i) => (s.has(id) ? [i] : []))
      const rs = R.sets.flatMap((s, i) => (s.has(id) ? [i] : []))
      for (const l of ls.length ? ls : [-1])
        for (const r of rs.length ? rs : [-1]) {
          if (l < 0 && r < 0) continue
          const k = `${l}|${r}`
          pairs.set(k, [...(pairs.get(k) ?? []), a.person.get(id)!.name])
        }
    }
    const raw = [...pairs].map(([k, who]) => {
      const [l, r] = k.split('|').map(Number)
      return { l, r, who }
    })
    const mk = (fs: Faction[], at: 'l' | 'r') => {
      const list: Side[] = fs.map((f) => ({ key: f.id, name: shortName(f), color: f.color, f, y0: 0, y1: 0, n: 0 }))
      list.push({ key: 'none', name: NONE, color: 'var(--rule-2)', y0: 0, y1: 0, n: 0 })
      for (const b of raw) list[(at === 'l' ? b.l : b.r) < 0 ? list.length - 1 : at === 'l' ? b.l : b.r].n += b.who.length
      return list
    }
    const left = mk(L.fs, 'l')
    const right = mk(R.fs, 'r')
    const ix = (i: number, list: Side[]) => (i < 0 ? list.length - 1 : i)
    const stack = (list: Side[]) => {
      let y = 0
      for (const s of list) {
        if (!s.n) continue
        s.y0 = y
        s.y1 = y + s.n * PX
        y = s.y1 + GAP
      }
      return y - GAP
    }
    const H = Math.max(stack(left), stack(right))
    const bands: Band[] = raw.map((b) => ({ l: ix(b.l, left), r: ix(b.r, right), who: b.who, ly: 0, ry: 0, h: b.who.length * PX }))
    const off = new Map<string, number>()
    for (const b of [...bands].sort((x, y) => x.l - y.l || x.r - y.r)) {
      const k = `l${b.l}`
      b.ly = left[b.l].y0 + (off.get(k) ?? 0)
      off.set(k, (off.get(k) ?? 0) + b.h)
    }
    for (const b of [...bands].sort((x, y) => x.r - y.r || x.l - y.l)) {
      const k = `r${b.r}`
      b.ry = right[b.r].y0 + (off.get(k) ?? 0)
      off.set(k, (off.get(k) ?? 0) + b.h)
    }
    return { left, right, bands, H }
  }, [a, A, B])

  const Wd = Math.max(width, 520)
  const room = (list: Side[]) => Math.max(...list.filter((s) => s.n).map((s) => s.name.length * 13 + 36))
  const LX = room(left)
  const RX = Wd - room(right) - BAR
  const mid = (LX + BAR + RX) / 2
  const on = (b: Band) => !hover || (hover.side === 'l' ? b.l === hover.i : b.r === hover.i)

  return (
    <div className="card pad flow" ref={ref}>
      <div className="seg" style={{ marginBottom: 12 }}>
        {PAIRS.map(([x, y], i) => (
          <button key={i} className={i === pick ? 'on' : undefined} onClick={() => setPick(i)}>
            {FRAMES[x].name} → {FRAMES[y].name}
          </button>
        ))}
      </div>
      <svg width="100%" height={H + 8} viewBox={`0 -4 ${Wd} ${H + 8}`} role="img" aria-label={`${FRAMES[A].name}与${FRAMES[B].name}的人员流向`}>
        {bands.map((b, i) => {
          const lc = left[b.l].color
          return (
            <path
              key={i}
              d={`M${LX + BAR},${b.ly} C${mid},${b.ly} ${mid},${b.ry} ${RX},${b.ry} L${RX},${b.ry + b.h} C${mid},${b.ry + b.h} ${mid},${b.ly + b.h} ${LX + BAR},${b.ly + b.h} Z`}
              fill={left[b.l].f ? lc : right[b.r].color}
              fillOpacity={on(b) ? 0.42 : 0.06}
              className="fl-band"
              onMouseMove={(e) =>
                tip.show(
                  e,
                  <>
                    <b>{left[b.l].name} → {right[b.r].name}</b> · {b.who.length} 人<div className="m">{b.who.join('、')}</div>
                  </>,
                )
              }
              onMouseLeave={tip.hide}
            />
          )
        })}
        {([['l', left, LX], ['r', right, RX]] as const).map(([k, list, x]) =>
          list.map((s, i) =>
            s.n ? (
              <g key={`${k}${i}`} onMouseEnter={() => setHover({ side: k, i })} onMouseLeave={() => setHover(null)} className="fl-node">
                <rect x={x} y={s.y0} width={BAR} height={s.y1 - s.y0} rx={3} fill={s.color} />
                <text x={k === 'l' ? x - 8 : x + BAR + 8} y={(s.y0 + s.y1) / 2} dy="0.35em" textAnchor={k === 'l' ? 'end' : 'start'} className="fl-name">
                  {s.name} <tspan className="fl-n">{s.n}</tspan>
                </text>
              </g>
            ) : null,
          ),
        )}
      </svg>
      <div className="legend small">
        <span className="muted">带宽＝两边同时点名的人数；同一侧被两个派系点名的人各算一次；悬停看名单</span>
      </div>
      {tip.node}
    </div>
  )
}

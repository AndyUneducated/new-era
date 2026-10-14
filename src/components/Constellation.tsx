// Everyone any faction names, in one field. Under the chosen frame each faction pulls its people into a
// cluster and people named by two factions settle between them; people the frame does not name drift to the
// rim. Switching frames moves the same faces (decisions #23).
import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import type { Atlas, PersonR } from '../data/db'
import type { Faction, Frame } from '../data/schema'
import { level, peopleIn, shortName } from '../lib/faction'
import { factionHref, go, personHref } from '../lib/router'
import { useAtlas } from '../state'
import { useTip } from './bits'
import { Face } from './Face'

const W = 1000
const H = 740
const RIM = 340
const SIZE: Record<number, number> = { 4: 11, 3: 8.5, 2: 6.5, 1: 5.5 }

interface Node extends d3.SimulationNodeDatum { id: string; r: number; tx?: number; ty?: number; fs: number[] }
interface Cluster { f: Faction; x: number; y: number; rad: number; n: number }

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

function layout(a: Atlas, frame: Frame, everyone: PersonR[]) {
  const fs = a.db.factions.filter((f) => f.frame === frame)
  const sets = fs.map((f) => new Set(peopleIn(a, f)))
  const weight = sets.map((s) => Math.sqrt(s.size) + 1.5)
  const total = d3.sum(weight)
  const CR = fs.length > 1 ? 232 : 0
  let acc = -Math.PI / 2
  const centres = fs.map((_, i) => {
    const t = acc + (weight[i] / total) * Math.PI
    acc += (weight[i] / total) * 2 * Math.PI
    return { x: CR * Math.cos(t), y: CR * 0.86 * Math.sin(t) }
  })
  const nodes: Node[] = everyone.map((p) => {
    const mine = fs.flatMap((_, i) => (sets[i].has(p.id) ? [i] : []))
    const h = hash(p.id)
    const r = SIZE[level(a, p)]
    if (!mine.length) {
      const t = ((h % 3600) / 3600) * 2 * Math.PI
      return { id: p.id, r: r * 0.8, fs: mine, x: RIM * Math.cos(t), y: RIM * Math.sin(t) }
    }
    const tx = d3.mean(mine, (i) => centres[i].x)!
    const ty = d3.mean(mine, (i) => centres[i].y)!
    return { id: p.id, r, fs: mine, tx, ty, x: tx + ((h % 41) - 20), y: ty + (((h >> 6) % 41) - 20) }
  })
  d3.forceSimulation(nodes)
    .force('x', d3.forceX<Node>((d) => d.tx ?? 0).strength((d) => (d.tx === undefined ? 0 : d.fs.length > 1 ? 0.08 : 0.16)))
    .force('y', d3.forceY<Node>((d) => d.ty ?? 0).strength((d) => (d.tx === undefined ? 0 : d.fs.length > 1 ? 0.08 : 0.16)))
    .force('rim', d3.forceRadial<Node>(RIM).strength((d) => (d.tx === undefined ? 0.4 : 0)))
    .force('collide', d3.forceCollide<Node>((d) => d.r + (d.r >= SIZE[4] ? 9 : 1.8)).iterations(3))
    .stop()
    .tick(280)
  const pos = new Map(nodes.map((n) => [n.id, n]))
  // a halo hugs the people only this faction names; those shared with another sit between halos
  const clusters: Cluster[] = fs.map((f, i) => {
    const all = nodes.filter((n) => n.fs.includes(i))
    const solo = all.filter((n) => n.fs.length === 1)
    const x = d3.mean(solo, (n) => n.x!) ?? centres[i].x
    const y = d3.mean(solo, (n) => n.y!) ?? centres[i].y
    const rad = (d3.quantile(solo.map((n) => Math.hypot(n.x! - x, n.y! - y) + n.r), 0.85) ?? 10) + 12
    return { f, x, y, rad, n: all.length }
  })
  return { pos, clusters }
}

export function Constellation({ frame }: { frame: Frame }) {
  const a = useAtlas()
  const tip = useTip()
  const [focus, setFocus] = useState<number | null>(null)
  const everyone = useMemo(() => {
    const ids = new Set(a.db.factions.flatMap((f) => peopleIn(a, f)))
    return [...ids].map((id) => a.person.get(id)!).sort((x, y) => level(a, x) - level(a, y))
  }, [a])
  const cache = useMemo(() => new Map<Frame, ReturnType<typeof layout>>(), [a])
  const { pos, clusters } = useMemo(() => {
    if (!cache.has(frame)) cache.set(frame, layout(a, frame, everyone))
    return cache.get(frame)!
  }, [a, frame, everyone, cache])
  const named = everyone.filter((p) => pos.get(p.id)!.fs.length).length

  return (
    <div className="constellation">
      <svg viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} role="img" aria-label="全部派系人物">
        <defs>
          {Object.values(SIZE).flatMap((r) => [r, r * 0.8]).map((r) => (
            <clipPath key={r} id={`cs-${r}`}>
              <circle r={r} />
            </clipPath>
          ))}
        </defs>
        <circle r={RIM} fill="none" stroke="var(--rule-2)" strokeDasharray="2 6" />
        <text y={-RIM - 10} textAnchor="middle" className="cs-rim">
          外圈：此框架未归派的 {everyone.length - named} 人
        </text>
        {clusters.map((c, i) => (
          <circle
            key={c.f.id}
            className="cs-halo"
            style={{ transform: `translate(${c.x}px,${c.y}px)` }}
            r={c.rad}
            fill={c.f.color}
            fillOpacity={focus === null || focus === i ? 0.1 : 0.03}
            stroke={c.f.color}
            strokeOpacity={focus === i ? 0.6 : 0.18}
          />
        ))}
        {everyone.map((p) => {
          const n = pos.get(p.id)!
          const col = n.fs.length ? clusters[n.fs[0]].f.color : 'var(--rule-2)'
          const dim = focus !== null ? !n.fs.includes(focus) : !n.fs.length
          return (
            <g
              key={p.id}
              className="cs-node"
              style={{ transform: `translate(${n.x}px,${n.y}px)`, opacity: dim ? (n.fs.length ? 0.15 : 0.3) : 1 }}
              onMouseMove={(e) =>
                tip.show(
                  e,
                  <>
                    <b>{p.name}</b>
                    <div className="m">{p.headline}</div>
                    <div style={{ marginTop: 4 }}>{n.fs.length ? n.fs.map((i) => clusters[i].f.name).join('、') : '此框架下未归派'}</div>
                  </>,
                )
              }
              onMouseLeave={tip.hide}
              onClick={() => go(personHref(p.id))}
            >
              <circle r={n.r + 1.4} fill={col} />
              {n.fs.length > 1 && <circle r={n.r + 3.4} fill="none" stroke={clusters[n.fs[1]].f.color} strokeWidth={1.4} />}
              <Face p={p} r={n.r} clip={`cs-${n.r}`} />
              {n.r >= SIZE[4] && <text y={n.r + 11} textAnchor="middle" className="cs-name">{p.name}</text>}
            </g>
          )
        })}
        {clusters.map((c, i) =>
          c.n ? (
            <g
              key={c.f.id}
              className="cs-label"
              style={{ transform: `translate(${c.x}px,${c.y - c.rad - 6}px)` }}
              onMouseEnter={() => setFocus(i)}
              onMouseLeave={() => setFocus(null)}
              onClick={() => go(factionHref(c.f.id))}
            >
              <text textAnchor="middle" fill={c.f.color}>
                {shortName(c.f)}
                <tspan className="cs-n" dx={4}>{c.n}</tspan>
              </text>
            </g>
          ) : null,
        )}
      </svg>
      <div className="legend small">
        <span>头像大小＝最高职级</span>
        <span>
          <i style={{ background: 'transparent', border: '1.5px solid var(--gold)' }} />
          外环＝同时属第二个派系
        </span>
        <span className="muted">切换上方框架，同一批人重新归队；悬停派系名高亮其成员</span>
      </div>
      {tip.node}
    </div>
  )
}

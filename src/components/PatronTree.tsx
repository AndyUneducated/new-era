// Who brought up whom: recorded patron and secretary ties among the faction's people, and, for members with
// no recorded tie, the years they served in a province while the centre of the faction held a leading post there.
import * as d3 from 'd3'
import { useMemo } from 'react'
import type { Atlas, PersonR } from '../data/db'
import { RELATIONS, type Faction } from '../data/schema'
import { centre, membersOf, overlaps, stints } from '../lib/faction'
import { go, personHref } from '../lib/router'
import { useAtlas } from '../state'
import { Src, useTip } from './bits'
import { Face } from './Face'

const LEAD = /书记|省长|市长|主席|司令员|政委|部长|主任/
const DX = 190
const DY = 38

interface Edge { from: string; to: string; label: string; derived: boolean; cite?: string; text?: string }

function edges(a: Atlas, f: Faction): { root?: PersonR; parent: Map<string, Edge> } {
  const id = centre(f)
  const root = id ? a.person.get(id) : undefined
  const parent = new Map<string, Edge>()
  if (!root) return { parent }
  const people = new Set([root.id, ...membersOf(a, f).map((m) => m.p.id)])
  const out = new Map<string, Edge[]>()
  for (const r of a.db.relations)
    if ((r.kind === 'patron' || r.kind === 'secretary') && people.has(r.a) && people.has(r.b))
      out.set(r.a, [...(out.get(r.a) ?? []), { from: r.a, to: r.b, label: RELATIONS[r.kind], derived: false, cite: r.cite, text: r.text }])
  // breadth first from the centre over recorded ties
  const queue = [root.id]
  const seen = new Set(queue)
  while (queue.length) {
    const cur = queue.shift()!
    for (const e of out.get(cur) ?? [])
      if (!seen.has(e.to)) {
        seen.add(e.to)
        parent.set(e.to, e)
        queue.push(e.to)
      }
  }
  const lead = stints(root).filter((s) => LEAD.test(s.title))
  for (const pid of people) {
    if (seen.has(pid)) continue
    const o = overlaps(lead, stints(a.person.get(pid)!))
    if (!o.length) continue
    const first = o.sort((x, y) => x.from - y.from)[0]
    parent.set(pid, { from: root.id, to: pid, label: `${first.place} ${Math.floor(first.from)}–${Math.floor(first.to)}`, derived: true, text: `${first.title}，时${root.name}任${first.with}` })
  }
  return { root, parent }
}

export function PatronTree({ f }: { f: Faction }) {
  const a = useAtlas()
  const tip = useTip()
  const { root, parent } = useMemo(() => edges(a, f), [a, f])
  const layout = useMemo(() => {
    if (!root || !parent.size) return null
    const ids = [root.id, ...parent.keys()]
    const h = d3
      .stratify<string>()
      .id((d) => d)
      .parentId((d) => (d === root.id ? null : parent.get(d)!.from))(ids)
      .sort((x, y) => (y.height - x.height) || x.id!.localeCompare(y.id!))
    return d3.tree<string>().nodeSize([DY, DX])(h)
  }, [root, parent])
  if (!root || !layout) return null
  const nodes = layout.descendants()
  const x0 = d3.min(nodes, (n) => n.x)! - DY
  const x1 = d3.max(nodes, (n) => n.x)! + DY
  const y1 = d3.max(nodes, (n) => n.y)! + DX
  const derived = [...parent.values()].filter((e) => e.derived).length

  return (
    <div className="card pad ptree">
      <div className="ptree-scroll">
        <svg width={y1 + 40} height={x1 - x0} viewBox={`-40 ${x0} ${y1 + 40} ${x1 - x0}`} role="img" aria-label={`${f.name}的提携树`}>
          <defs>
            {nodes.map((n) => (
              <clipPath key={n.id} id={`pt-${n.id}`}>
                <circle r={n.depth ? 13 : 20} />
              </clipPath>
            ))}
          </defs>
          {layout.links().map((l) => {
            const e = parent.get(l.target.id!)!
            const path = d3.linkHorizontal<unknown, { x: number; y: number }>().x((d) => d.y).y((d) => d.x)({ source: l.source, target: l.target })!
            return (
              <g key={l.target.id}>
                <path d={path} fill="none" stroke={f.color} strokeOpacity={e.derived ? 0.4 : 0.85} strokeWidth={e.derived ? 1.2 : 2} strokeDasharray={e.derived ? '4 4' : undefined} />
              </g>
            )
          })}
          {nodes.map((n) => {
            const p = a.person.get(n.id!)!
            const e = parent.get(n.id!)
            const r = n.depth ? 13 : 20
            return (
              <g
                key={n.id}
                className="gx-node"
                transform={`translate(${n.y},${n.x})`}
                onClick={() => go(personHref(p.id))}
                onMouseMove={(ev) =>
                  tip.show(
                    ev,
                    <>
                      <b>{p.name}</b>
                      <div className="m">{p.headline}</div>
                      {e && (
                        <div style={{ marginTop: 5 }}>
                          <b style={{ color: f.color }}>{e.derived ? '同地任职（据履历推算）' : e.label}</b> {e.text} {e.cite && <Src cite={e.cite} />}
                        </div>
                      )}
                    </>,
                  )
                }
                onMouseLeave={tip.hide}
                role="link"
                tabIndex={0}
                aria-label={p.name}
              >
                <circle r={r + 2} fill={f.color} />
                <Face p={p} r={r} clip={`pt-${n.id}`} />
                {n.depth ? (
                  <text x={r + 6} dy="0.35em" className="pt-name">
                    {p.name}
                    {e && <tspan className="pt-edge" dx={6}>{e.label}</tspan>}
                  </text>
                ) : (
                  <text y={r + 15} textAnchor="middle" className="pt-name">
                    {p.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="legend small">
        <span>
          <i style={{ background: f.color }} />
          实线＝来源记载的提携、秘书关系
        </span>
        {derived > 0 && (
          <span>
            <i className="dashed" style={{ borderColor: f.color }} />
            虚线＝据履历推算：在{root.name}主政的省份同期任职（{derived} 人）
          </span>
        )}
      </div>
      {tip.node}
    </div>
  )
}

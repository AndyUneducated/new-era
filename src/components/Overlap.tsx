// Which factions name the same people: a chord per pair, its width the number of people both name. Arcs are
// grouped by frame, so chords inside a group are overlaps within one way of dividing the elite and chords
// across groups are the same people seen through two frames.
import * as d3 from 'd3'
import { useMemo, useState } from 'react'
import type { Frame } from '../data/schema'
import { FRAMES } from '../data/schema'
import { peopleIn, shortName } from '../lib/faction'
import { factionHref, go } from '../lib/router'
import { useAtlas } from '../state'
import { useTip } from './bits'

const TOP = 22
const S = 800
const R = S / 2 - 130

export function Overlap() {
  const a = useAtlas()
  const tip = useTip()
  const [focus, setFocus] = useState<number | null>(null)
  const { fs, sets, chords } = useMemo(() => {
    const order = Object.keys(FRAMES) as Frame[]
    const all = a.db.factions.map((f) => ({ f, s: new Set(peopleIn(a, f)) })).filter((x) => x.s.size >= 3)
    const top = [...all].sort((x, y) => y.s.size - x.s.size).slice(0, TOP)
    top.sort((x, y) => order.indexOf(x.f.frame) - order.indexOf(y.f.frame) || y.s.size - x.s.size)
    const sets = top.map((x) => x.s)
    const m = sets.map((s, i) => sets.map((t, j) => (i === j ? 0 : [...s].filter((id) => t.has(id)).length)))
    return { fs: top.map((x) => x.f), sets, chords: d3.chord().padAngle(0.025).sortSubgroups(d3.descending)(m) }
  }, [a])
  const arc = d3.arc<d3.ChordGroup>().innerRadius(R).outerRadius(R + 14)
  const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(R - 12)
  const frames = d3.groups(chords.groups, (g) => fs[g.index].frame)
  const shared = (i: number, j: number) => [...sets[i]].filter((id) => sets[j].has(id)).map((id) => a.person.get(id)!.name)

  return (
    <div className="card pad overlap">
      <svg viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} role="img" aria-label="派系之间的重叠">
        {frames.map(([fr, gs]) => {
          const g = { startAngle: gs[0].startAngle, endAngle: gs.at(-1)!.endAngle } as d3.ChordGroup
          const mid = (g.startAngle + g.endAngle) / 2
          return (
            <g key={fr}>
              <path d={d3.arc<d3.ChordGroup>().innerRadius(R - 8).outerRadius(R - 5)(g)!} fill="var(--gold)" opacity={0.7} />
              <text x={(R - 30) * Math.sin(mid)} y={-(R - 30) * Math.cos(mid)} textAnchor={Math.abs(Math.sin(mid)) < 0.3 ? 'middle' : Math.sin(mid) > 0 ? 'end' : 'start'} dy="0.35em" className="ov-frame">
                {FRAMES[fr as Frame].name}
              </text>
            </g>
          )
        })}
        {chords.map((c, i) => {
          const lit = focus === null || c.source.index === focus || c.target.index === focus
          return (
            <path
              key={i}
              d={ribbon(c) as unknown as string}
              fill={fs[c.source.value >= c.target.value ? c.source.index : c.target.index].color}
              fillOpacity={lit ? 0.5 : 0.04}
              stroke="var(--card)"
              strokeWidth={0.5}
              onMouseMove={(e) => {
                const who = shared(c.source.index, c.target.index)
                tip.show(e, <><b>{fs[c.source.index].name} ∩ {fs[c.target.index].name}</b> · {who.length} 人<div className="m">{who.join('、')}</div></>)
              }}
              onMouseLeave={tip.hide}
            />
          )
        })}
        {chords.groups.map((g) => {
          const f = fs[g.index]
          const mid = (g.startAngle + g.endAngle) / 2
          return (
            <g key={f.id} className="ov-arc" onMouseEnter={() => setFocus(g.index)} onMouseLeave={() => setFocus(null)} onClick={() => go(factionHref(f.id))}>
              <path d={arc(g)!} fill={f.color} />
              <text transform={`rotate(${(mid * 180) / Math.PI - 90}) translate(${R + 26},0)${mid > Math.PI ? ' rotate(180)' : ''}`} textAnchor={mid > Math.PI ? 'end' : 'start'} dy="0.35em" className="ov-name">
                {shortName(f)} <tspan className="fl-n">{sets[g.index].size}</tspan>
              </text>
            </g>
          )
        })}
      </svg>
      <div className="legend small">
        <span className="muted">取人数最多的 {fs.length} 个派系；弦宽＝两派共同点名的人数；外圈金线把同一框架的派系归在一起；悬停派系看它与谁重叠</span>
      </div>
      {tip.node}
    </div>
  )
}
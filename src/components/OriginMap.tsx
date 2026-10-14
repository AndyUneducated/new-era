// Where the faction's people served: provinces shaded by how many members held a post there, and the
// route of the faction's centre from post to post.
import * as d3 from 'd3'
import { useEffect, useMemo, useState } from 'react'
import type { Faction } from '../data/schema'
import { centre, membersOf, stints } from '../lib/faction'
import { useWidth } from '../lib/useSize'
import { useAtlas } from '../state'
import { useTip } from './bits'

type Geo = d3.ExtendedFeatureCollection<d3.ExtendedFeature<d3.GeoGeometryObjects, { name: string }>>
let cache: Promise<Geo> | undefined
const loadGeo = () => (cache ??= fetch('geo/china.json').then((r) => r.json() as Promise<Geo>))

export function OriginMap({ f }: { f: Faction }) {
  const a = useAtlas()
  const tip = useTip()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [geo, setGeo] = useState<Geo | null>(null)
  useEffect(() => {
    loadGeo().then(setGeo, () => setGeo(null))
  }, [])
  const { by, route, hub } = useMemo(() => {
    const by = new Map<string, Set<string>>()
    const ms = membersOf(a, f)
    for (const m of ms) for (const s of stints(m.p)) by.set(s.place, new Set([...(by.get(s.place) ?? []), m.p.name]))
    const hubId = centre(f)
    const hub = hubId ? a.person.get(hubId) : undefined
    const route: { place: string; from: number }[] = []
    for (const s of (hub ? stints(hub) : []).sort((x, y) => x.from - y.from)) if (route.at(-1)?.place !== s.place) route.push({ place: s.place, from: s.from })
    return { by, route, hub }
  }, [a, f])
  if (!by.size) return null
  const W = Math.max(width, 360)
  const H = W * 0.78
  const max = d3.max([...by.values()], (s) => s.size) ?? 1
  const shade = d3.scaleSqrt().domain([0, max]).range([0.22, 0.9])
  const proj = geo ? d3.geoMercator().fitExtent([[8, 8], [W - 8, H - 8]], { ...geo, features: geo.features.filter((x) => x.properties.name) }) : null
  const path = proj ? d3.geoPath(proj) : null
  const centroid = new Map(geo && path ? geo.features.filter((x) => x.properties.name).map((x) => [x.properties.name, path.centroid(x)] as const) : [])
  const hops = route.map((r) => ({ ...r, at: centroid.get(r.place) })).filter((r): r is typeof r & { at: [number, number] } => !!r.at)

  return (
    <div className="card pad omap" ref={ref}>
      {!geo || !path ? (
        <div className="empty" style={{ height: H }}>地图载入中</div>
      ) : (
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${f.name}成员任职省份`}>
          <defs>
            <marker id={`om-arrow-${f.id}`} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
            </marker>
          </defs>
          {geo.features.map((x, i) => {
            const name = x.properties.name
            const who = by.get(name)
            return (
              <path
                key={i}
                d={path(x) ?? undefined}
                fill={!name ? 'none' : who ? f.color : 'var(--paper-2)'}
                fillOpacity={who ? shade(who.size) : 1}
                stroke={name ? 'var(--card)' : 'var(--muted)'}
                strokeWidth={name ? 0.8 : 0.6}
                onMouseMove={(e) => name && tip.show(e, <><b>{name}</b> · {who?.size ?? 0} 人<div className="m">{who ? [...who].join('、') : '无成员在此任职的记录'}</div></>)}
                onMouseLeave={tip.hide}
              />
            )
          })}
          {[...by].map(([name, s]) => {
            const c = centroid.get(name)
            return c && s.size >= Math.max(2, max / 6) ? (
              <text key={name} x={c[0]} y={c[1] + 4} textAnchor="middle" className="om-count" pointerEvents="none">
                {s.size}
              </text>
            ) : null
          })}
          {hops.slice(1).map((h, i) => {
            const p = hops[i].at
            const q = h.at
            const mx = (p[0] + q[0]) / 2 - (q[1] - p[1]) * 0.25
            const my = (p[1] + q[1]) / 2 + (q[0] - p[0]) * 0.25
            return <path key={i} d={`M${p[0]},${p[1]} Q${mx},${my} ${q[0]},${q[1]}`} fill="none" stroke="var(--ink)" strokeWidth={1.6} strokeOpacity={0.75} markerEnd={`url(#om-arrow-${f.id})`} pointerEvents="none" />
          })}
          {hops.map((h, i) => (
            <g key={i} transform={`translate(${h.at[0]},${h.at[1]})`} pointerEvents="none">
              <circle r={9} fill="var(--ink)" />
              <text dy="0.35em" textAnchor="middle" className="om-hop">
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
      )}
      <div className="legend small">
        <span>
          <i style={{ background: f.color }} />
          颜色越深＝在该省任过职的成员越多
        </span>
        {hub && hops.length > 1 && (
          <span>
            ① → {hops.length}：{hub.name}的任职路线（{hops.map((h) => h.place).join(' → ')}）
          </span>
        )}
      </div>
      {tip.node}
    </div>
  )
}

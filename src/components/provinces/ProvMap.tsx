// The 诸侯图 map: each province filled with the faction of the holder of the chosen post in the chosen
// year, the holder's face and name on it; a name in red is someone who later fell.
import * as d3 from 'd3'
import { useMemo } from 'react'
import { PROVINCES, type Frame, type Province } from '../../data/schema'
import { fellAfter, holderAt, tenures, type Post, type Tenure } from '../../lib/chiefs'
import { useGeo } from '../../lib/geo'
import { useWidth } from '../../lib/useSize'
import { useAtlas } from '../../state'
import { useTip } from '../bits'
import { Face } from '../Face'
import { TenureTip } from './TenureTip'

// label nudges for the crowded east coast, in units of the map width
const NUDGE: Partial<Record<Province, [number, number]>> = {
  北京: [-0.012, -0.03],
  天津: [0.03, 0.006],
  河北: [-0.03, 0.03],
  上海: [0.035, 0.008],
  江苏: [-0.005, -0.012],
  浙江: [0.004, 0.012],
  海南: [0, 0.012],
  宁夏: [-0.006, 0],
  重庆: [0.008, 0.008],
  广东: [0.004, -0.008],
}

export function ProvMap({ year, post, frame, pick, onPick }: { year: number; post: Post; frame: Frame; pick?: Province; onPick: (p: Province) => void }) {
  const a = useAtlas()
  const tip = useTip()
  const geo = useGeo()
  const [ref, width] = useWidth<HTMLDivElement>()
  const list = useMemo(() => tenures(a), [a])
  const W = Math.max(width, 340)
  const H = W * 0.74
  const { path, centroid } = useMemo(() => {
    if (!geo) return { path: null, centroid: new Map<string, [number, number]>() }
    const named = geo.features.filter((x) => x.properties.name)
    const proj = d3.geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], { ...geo, features: named })
    const path = d3.geoPath(proj)
    return { path, centroid: new Map(named.map((x) => [x.properties.name, path.centroid(x)] as const)) }
  }, [geo, W, H])
  const r = Math.max(9, Math.min(17, W / 62))

  const holder = (prov: Province) => holderAt(list, prov, post, year + 0.5)
  const colorOf = (t?: Tenure) => (t?.p ? a.factionIn(t.p, frame)?.color : undefined)
  const show = (e: React.MouseEvent, prov: Province) =>
    tip.show(
      e,
      <div>
        <b>{prov}</b> <span className="m">· {year} 年</span>
        {(['sec', 'gov'] as const).map((k) => {
          const t = holderAt(list, prov, k, year + 0.5)
          return t ? <TenureTip key={k} t={t} frame={frame} /> : <div key={k} className="m">{k === 'sec' ? '书记' : '行政首长'}：未收录</div>
        })}
      </div>,
    )

  return (
    <div className="pv-map" ref={ref}>
      {!geo || !path ? (
        <div className="empty" style={{ height: H }}>地图载入中</div>
      ) : (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${year} 年各省${post === 'sec' ? '党委书记' : '行政首长'}`}>
          <defs>
            <pattern id="pv-none" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--paper-2)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--rule-2)" strokeWidth="1.4" />
            </pattern>
          </defs>
          {geo.features.map((x, i) => {
            const name = x.properties.name as Province
            const known = PROVINCES.includes(name)
            const t = known ? holder(name) : undefined
            const c = colorOf(t)
            return (
              <path
                key={i}
                d={path(x) ?? undefined}
                className={known ? 'pv-prov' : undefined}
                fill={!name ? 'none' : !known ? 'var(--paper-2)' : c ?? (t ? 'var(--card-2)' : 'url(#pv-none)')}
                fillOpacity={c ? 0.78 : 1}
                stroke={pick === name ? 'var(--ink)' : name ? 'var(--card)' : 'var(--muted)'}
                strokeWidth={pick === name ? 2.2 : name ? 0.9 : 0.6}
                style={{ transition: 'fill .5s, fill-opacity .5s' }}
                onMouseMove={(e) => known && show(e, name)}
                onMouseLeave={tip.hide}
                onClick={() => known && onPick(name)}
              />
            )
          })}
          {PROVINCES.map((prov) => {
            const c = centroid.get(prov)
            const t = holder(prov)
            if (!c || !t) return null
            const [nx, ny] = NUDGE[prov] ?? [0, 0]
            const x = c[0] + nx * W
            const y = c[1] + ny * W
            const fell = !!fellAfter(t)
            const id = `pv-f-${prov}`
            return (
              <g key={prov} transform={`translate(${x},${y})`} className="pv-face" onClick={() => onPick(prov)} onMouseMove={(e) => show(e, prov)} onMouseLeave={tip.hide}>
                <circle r={r + 2} fill="var(--card)" stroke={fell ? 'var(--seal)' : 'var(--card)'} strokeWidth={fell ? 2 : 1} />
                <clipPath id={id}>
                  <circle r={r} />
                </clipPath>
                {t.p ? (
                  <Face p={t.p} r={r} clip={id} grey={fell} />
                ) : (
                  <text textAnchor="middle" dy="0.36em" fontSize={r * 0.8} className="pv-initial">
                    {t.name.slice(0, 1)}
                  </text>
                )}
                <text y={r + 12} textAnchor="middle" className={fell ? 'pv-name fell' : 'pv-name'}>
                  {t.name}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      <div className="pv-key">
        <span><i className="fell" />红圈红名：任上或卸任后落马</span>
        <span><i className="none" />斜线：该年尚未收录</span>
        <span>点省份看历任</span>
      </div>
      {tip.node}
    </div>
  )
}

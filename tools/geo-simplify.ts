// One-off: shrink the DataV province GeoJSON (https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json)
// to public/geo/china.json for the origin map. node tools/geo-simplify.ts <input.json>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { geoArea } from 'd3'

type Ring = [number, number][]
const STEP = 0.1
const q = (v: number) => Math.round(v / STEP) * STEP

const short = (name: string) =>
  name.replace(/(维吾尔|壮族|回族)?自治区$|特别行政区$|省$|市$/, '') || name

function ring(r: Ring): Ring | null {
  const out: Ring = []
  for (const [x, y] of r) {
    const p: [number, number] = [+q(x).toFixed(2), +q(y).toFixed(2)]
    const last = out.at(-1)
    if (!last || last[0] !== p[0] || last[1] !== p[1]) out.push(p)
  }
  return out.length >= 4 ? out : null
}

const src = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const features = src.features.map((f: { properties: { name: string; adcode: number }; geometry: { type: string; coordinates: unknown } }) => {
  const g = f.geometry
  let coordinates: unknown
  if (g.type === 'Polygon') coordinates = (g.coordinates as Ring[]).map(ring).filter(Boolean)
  else if (g.type === 'MultiPolygon') coordinates = (g.coordinates as Ring[][]).map((p) => p.map(ring).filter(Boolean)).filter((p) => p.length)
  else coordinates = (g.coordinates as Ring[]).map((l) => l.map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]))
  const geometry = { type: g.type, coordinates } as GeoJSON.Polygon | GeoJSON.MultiPolygon
  // d3-geo wants clockwise outer rings; GeoJSON (and DataV) wind them the other way
  if (g.type !== 'MultiLineString')
    for (const p of (g.type === 'Polygon' ? [coordinates] : coordinates) as Ring[][])
      if (geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI) for (const r of p) r.reverse()
  return { type: 'Feature', properties: { name: short(f.properties.name ?? ''), adcode: f.properties.adcode }, geometry }
})
mkdirSync('public/geo', { recursive: true })
writeFileSync('public/geo/china.json', JSON.stringify({ type: 'FeatureCollection', features }))
console.log(features.map((f: { properties: { name: string } }) => f.properties.name).join(' '))

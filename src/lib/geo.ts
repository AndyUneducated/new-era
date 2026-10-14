import type * as d3 from 'd3'
import { useEffect, useState } from 'react'

export type Geo = d3.ExtendedFeatureCollection<d3.ExtendedFeature<d3.GeoGeometryObjects, { name: string }>>
let cache: Promise<Geo> | undefined
const loadGeo = () => (cache ??= fetch('geo/china.json').then((r) => r.json() as Promise<Geo>))

// the province outlines (public/geo/china.json), loaded once
export function useGeo(): Geo | null {
  const [geo, setGeo] = useState<Geo | null>(null)
  useEffect(() => {
    loadGeo().then(setGeo, () => setGeo(null))
  }, [])
  return geo
}

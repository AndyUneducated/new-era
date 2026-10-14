// Reading the isms and the central line at a moment t (a fractional year).
import { AXES, type Axis, type Ism, type IsmKind, type LinePoint } from '../data/schema'
import { fy } from './dates'
import { NOW } from './faction'

export const KIND_ORDER: IsmKind[] = ['core', 'line', 'trend', 'foreign', 'label']
export const ismColor = (k: IsmKind) => `var(--ism-${k})`
export const FIRST_YEAR = 1978

export const fromT = (m: Ism) => fy(m.from) ?? FIRST_YEAR
export const toT = (m: Ism) => (m.to ? fy(m.to)! : NOW)
export const aliveAt = (m: Ism, t: number) => fromT(m) <= t && t <= toT(m)

export type Pt = { x: number; y: number; z: number }
// linear between dated points, held flat before the first and after the last
export function track(points: ({ at: string } & Pt)[], t: number): Pt | undefined {
  if (!points.length) return undefined
  const ts = points.map((p) => fy(p.at)!)
  if (t <= ts[0]) return points[0]
  const i = ts.findIndex((u) => u > t)
  if (i < 0) return points.at(-1)
  const a = points[i - 1]
  const b = points[i]
  const k = (t - ts[i - 1]) / (ts[i] - ts[i - 1])
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k }
}

export const posAt = (m: Ism, t: number) => (aliveAt(m, t) ? track(m.pos, t) : undefined)

// the line's turns up to t, ending at where it stands at t
export function lineUntil(line: LinePoint[], t: number): Pt[] {
  const past = line.filter((p) => fy(p.at)! <= t)
  const now = track(line, t)
  return now && past.length ? [...past, now] : past
}

const word = (v: number, a: Axis) => (Math.abs(v) < 0.15 ? `${AXES[a].name}居中` : `${AXES[a].name}${Math.abs(v) > 0.6 ? '强烈' : ''}偏向${AXES[a].ends[v < 0 ? 0 : 1].split(' · ')[0]}`)
export const describe = (p: Pt) => (['x', 'y', 'z'] as Axis[]).map((a) => word(p[a], a)).join('，')

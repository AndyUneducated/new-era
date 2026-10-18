// A portrait inside an SVG chart: the photo clipped to a circle, or the first character of the name,
// inside the status frame.
import type { PersonR } from '../data/db'
import { MARK_STROKE, markOf, type Mark } from '../lib/fall'

export const fallen = (p: PersonR) => p.status === 'purged' || p.status === 'detained'

export function Ring({ r, mark }: { r: number; mark?: Mark | null }) {
  if (!mark) return null
  const s = MARK_STROKE[mark]
  const w = Math.max(1.5, Math.min(4, r * 0.12))
  return <circle r={r - w / 2} fill="none" stroke={s.color} strokeWidth={w} strokeDasharray={s.dash} pointerEvents="none" />
}

// `mark` overrides the frame from the status: a chart that runs through time frames whoever has fallen by then
export function Face({ p, r, clip, mark }: { p: PersonR; r: number; clip: string; mark?: Mark | null }) {
  return (
    <>
      <circle r={r} fill="var(--card)" />
      {p.photo?.src ? (
        <image href={p.photo.src} x={-r} y={-r} width={r * 2} height={r * 2} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMin slice" />
      ) : (
        <text textAnchor="middle" dy="0.36em" fontSize={r * 0.8} fontFamily="var(--serif)" fontWeight={900} fill="var(--ink-2)">
          {p.name.slice(0, 1)}
        </text>
      )}
      <Ring r={r} mark={mark === undefined ? markOf(p) : mark} />
    </>
  )
}

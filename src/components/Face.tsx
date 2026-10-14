// A portrait inside an SVG chart: the photo clipped to a circle, or the first character of the name.
import type { PersonR } from '../data/db'

export const fallen = (p: PersonR) => p.status === 'purged' || p.status === 'detained'

export function Face({ p, r, clip, grey }: { p: PersonR; r: number; clip: string; grey?: boolean }) {
  return (
    <>
      <circle r={r} fill="var(--card)" />
      {p.photo?.src ? (
        <image
          href={p.photo.src}
          x={-r}
          y={-r}
          width={r * 2}
          height={r * 2}
          clipPath={`url(#${clip})`}
          preserveAspectRatio="xMidYMin slice"
          style={{ filter: (grey ?? fallen(p)) ? 'grayscale(1)' : undefined }}
        />
      ) : (
        <text textAnchor="middle" dy="0.36em" fontSize={r * 0.8} fontFamily="var(--serif)" fontWeight={900} fill="var(--ink-2)">
          {p.name.slice(0, 1)}
        </text>
      )}
    </>
  )
}

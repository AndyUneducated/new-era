// A vermilion seal stamped over a fallen person: a square of double rules with uneven ink, the
// characters set two to a column, right column first, as on a 公文 seal.
import { useId } from 'react'

export function Seal({ text = '落马', size = 56, tilt = -9, stamp }: { text?: string; size?: number; tilt?: number; stamp?: boolean }) {
  const id = `ink${useId().replace(/[^a-z0-9]/gi, '')}`
  const chars = [...text]
  const cols = chars.length > 2 ? 2 : 1
  const rows = Math.ceil(chars.length / cols)
  const cell = 76 / Math.max(rows, cols)
  return (
    <svg className={stamp ? 'seal-mark stamp' : 'seal-mark'} width={size} height={size} viewBox="0 0 100 100" style={{ ['--tilt' as string]: `${tilt}deg` }} aria-label={text} role="img">
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={chars.length * 7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" result="d" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.05" result="holes" />
          <feComposite in="d" in2="holes" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill="none" stroke="var(--seal)">
        <rect x="5" y="5" width="90" height="90" rx="7" strokeWidth="6" />
        <rect x="13" y="13" width="74" height="74" rx="3" strokeWidth="1.6" />
        {chars.map((c, i) => {
          const col = cols - 1 - Math.floor(i / rows)
          const row = i % rows
          const x = 50 + (col - (cols - 1) / 2) * cell
          const y = 50 + (row - (rows - 1) / 2) * cell
          return (
            <text key={i} x={x} y={y} dy="0.36em" textAnchor="middle" fontSize={cell * 0.92} fontFamily="var(--seal-font)" fontWeight={900} fill="var(--seal)" stroke="none">
              {c}
            </text>
          )
        })}
      </g>
    </svg>
  )
}

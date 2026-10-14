// The Politburo of one congress as a hemicycle: the general secretary at the podium, the rest of the
// standing committee on the inner arc in photo-line order (2 right of centre, 3 left, 4 right…),
// full members on the outer arcs. Seats are coloured by the faction label in the chosen frame.
import { STATUS, type Congress, type Faction, type Frame } from '../data/schema'
import type { PersonR } from '../data/db'
import { age, short } from '../lib/dates'
import { go, personHref } from '../lib/router'
import { useAtlas } from '../state'
import { useTip } from './bits'

interface SeatPos { p: PersonR; x: number; y: number; r: number; seat: 'gs' | 'psc' | 'pb' }

const W = 1000
const H = 520
const CX = 0
const CY = 0

function arc(n: number, radius: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const t = Math.PI - ((i + 0.5) * Math.PI) / n
    return [CX + radius * Math.cos(t), CY - radius * Math.sin(t)]
  })
}

// photo-line order for ranks 2..n: …5 3 | 2 4…
function lineup<T>(ranked: T[]): T[] {
  const left: T[] = []
  const right: T[] = []
  ranked.forEach((x, i) => (i % 2 === 0 ? right : left).push(x))
  return [...left.reverse(), ...right]
}

export function layout(c: Congress, get: (id: string) => PersonR | undefined): SeatPos[] {
  const out: SeatPos[] = []
  const gs = get(c.gs)
  if (gs) out.push({ p: gs, x: CX, y: CY - 70, r: 58, seat: 'gs' })
  const psc = lineup(c.psc.filter((id) => id !== c.gs).map(get).filter((p): p is PersonR => !!p))
  arc(psc.length, 215).forEach(([x, y], i) => out.push({ p: psc[i], x, y, r: 36, seat: 'psc' }))
  const pb = c.pb.map(get).filter((p): p is PersonR => !!p)
  // one outer arc up to 12 seats; beyond that the labels under steep-side seats hit the next seat,
  // so alternate members between two staggered arcs
  if (pb.length <= 12) arc(pb.length, 370).forEach(([x, y], i) => out.push({ p: pb[i], x, y, r: 29, seat: 'pb' }))
  else {
    const inner = pb.filter((_, i) => i % 2 === 1)
    const outer = pb.filter((_, i) => i % 2 === 0)
    arc(inner.length, 330).forEach(([x, y], i) => out.push({ p: inner[i], x, y, r: 26, seat: 'pb' }))
    arc(outer.length, 425).forEach(([x, y], i) => out.push({ p: outer[i], x, y, r: 26, seat: 'pb' }))
  }
  return out
}

const rings = (c: Congress) => (c.pb.length <= 12 ? [215, 370] : [215, 330, 425])

export function Hemicycle({ c, frame }: { c: Congress; frame: Frame }) {
  const a = useAtlas()
  const tip = useTip()
  const seats = layout(c, (id) => a.person.get(id))
  const gone = new Map(c.changes.filter((x) => x.kind !== 'in').map((x) => [x.person, x]))
  const colorOf = (p: PersonR) => a.factionIn(p, frame)?.color

  return (
    <>
      <svg className="hemicycle" viewBox={`${-W / 2} ${-H + 40} ${W} ${H + 30}`} role="img" aria-label={`第${c.n}届中央政治局席位图`}>
        <defs>
          <radialGradient id="podium" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="var(--red)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--red)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={`M ${-460} 0 A 460 460 0 0 1 460 0 Z`} fill="url(#podium)" />
        {rings(c).map((r) => (
          <path key={r} d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke="var(--gold)" strokeOpacity="0.28" strokeDasharray="2 6" />
        ))}
        <line x1={-480} x2={480} y1={36} y2={36} stroke="var(--gold)" strokeOpacity="0.5" />
        {seats.map((s) => {
          const color = colorOf(s.p)
          const out = gone.get(s.p.id)
          const clip = `clip-${c.n}-${s.p.id}`
          const src = s.p.photo?.src
          return (
            <g
              key={s.p.id}
              className="seat"
              style={{ transform: `translate(${s.x}px, ${s.y}px)`, transition: 'transform 0.7s cubic-bezier(.2,.8,.2,1)' }}
              onClick={() => go(personHref(s.p.id))}
              onMouseMove={(e) => tip.show(e, <SeatTip p={s.p} c={c} frame={frame} out={out?.text} />)}
              onMouseLeave={tip.hide}
              tabIndex={0}
              role="link"
              aria-label={s.p.name}
              onKeyDown={(e) => e.key === 'Enter' && go(personHref(s.p.id))}
            >
              <circle r={s.r + 4} fill={color ?? 'var(--rule-2)'} opacity={color ? 1 : 0.6} />
              <circle r={s.r + 1} fill="var(--card)" />
              <clipPath id={clip}>
                <circle r={s.r} />
              </clipPath>
              {src ? (
                <image
                  href={src}
                  x={-s.r}
                  y={-s.r}
                  width={s.r * 2}
                  height={s.r * 2}
                  clipPath={`url(#${clip})`}
                  preserveAspectRatio="xMidYMin slice"
                  style={{ filter: s.p.status === 'purged' || s.p.status === 'detained' ? 'grayscale(1)' : 'saturate(.85)' }}
                />
              ) : (
                <text textAnchor="middle" dy="0.36em" fontSize={s.r * 0.8} fontFamily="var(--serif)" fontWeight={900} fill="var(--ink-2)">
                  {s.p.name.slice(0, 1)}
                </text>
              )}
              {out && (
                <g transform={`translate(${s.r * 0.72}, ${-s.r * 0.72})`}>
                  <circle r={9} fill="var(--red)" />
                  <text textAnchor="middle" dy="0.35em" fontSize={11} fill="#fff" fontWeight={700}>
                    {out.kind === 'died' ? '†' : '✕'}
                  </text>
                </g>
              )}
              <text className="seat-name" y={s.r + 18} textAnchor="middle" fontSize={s.seat === 'gs' ? 15 : s.seat === 'psc' ? 12.5 : 11.5}>
                {s.p.name}
              </text>
            </g>
          )
        })}
      </svg>
      {tip.node}
    </>
  )
}

function SeatTip({ p, c, frame, out }: { p: PersonR; c: Congress; frame: Frame; out?: string }) {
  const a = useAtlas()
  const tags = p.factions.map((t) => ({ t, f: a.faction.get(t.f) })).filter((x): x is { t: (typeof p.factions)[number]; f: Faction } => x.f?.frame === frame)
  const at = age(p.born, c.opened)
  return (
    <div>
      <b>{p.name}</b>
      <span className="m">
        {' '}
        {at !== undefined && `· 当选时 ${at} 岁`} · {STATUS[p.status]}
      </span>
      <div className="m" style={{ margin: '2px 0 6px' }}>{p.headline}</div>
      {tags.length ? (
        tags.map(({ t, f }) => (
          <div key={t.f + t.cite}>
            <span style={{ color: f.color, fontWeight: 700 }}>● {f.name}</span>
            <span className="m"> — {a.source.get(t.cite.split('@')[0])?.publisher ?? t.cite}</span>
          </div>
        ))
      ) : (
        <div className="m">此框架下无标注</div>
      )}
      {out && <div style={{ marginTop: 6, color: '#f6a38f' }}>{out}</div>}
      {p.fall[0] && !out && <div style={{ marginTop: 6, color: '#f6a38f' }}>{short(p.fall[0].date)} {p.fall[0].text}</div>}
    </div>
  )
}

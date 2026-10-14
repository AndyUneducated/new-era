// One person's circle: relatives (matched by name in either person's family list), people who share a
// faction label, and people who appear in the same events. Relation types sit in contiguous arcs.
import type { Atlas, PersonR } from '../data/db'
import type { Faction } from '../data/schema'
import { go, personHref } from '../lib/router'
import { useAtlas } from '../state'
import { Section, useTip } from './bits'

type Kind = 'family' | 'faction' | 'event'
interface Link { kind: Kind; text: string; color?: string }
interface Node { p: PersonR; links: Link[] }

const ORDER: Kind[] = ['family', 'faction', 'event']
const LABEL: Record<Kind, string> = { family: '家属', faction: '同派系', event: '同事件' }
const CAP: Record<Kind, number> = { family: 6, faction: 8, event: 6 }
const R = 160
const NODE = 22

function relations(a: Atlas, p: PersonR): Node[] {
  const nodes = new Map<string, Node>()
  const add = (q: PersonR | undefined, link: Link) => {
    if (!q || q.id === p.id) return
    const n = nodes.get(q.id) ?? { p: q, links: [] }
    n.links.push(link)
    nodes.set(q.id, n)
  }
  const weight = (q: PersonR) => (a.seats.get(q.id)?.length ?? 0) + (q.tier === 1 ? 2 : 0)

  // family names may carry a note: 谷开来（薄谷开来）
  const bare = (s: string) => s.replace(/[（(].*?[）)]/g, '').trim()
  const byName = new Map(a.db.people.map((q) => [q.name, q]))
  for (const m of p.family) add(byName.get(bare(m.name)), { kind: 'family', text: m.rel })
  for (const q of a.db.people) for (const m of q.family) if (bare(m.name) === p.name) add(q, { kind: 'family', text: `${q.name}的${m.rel}` })

  const shared = new Map<string, Faction[]>()
  for (const f of new Set(p.factions.map((t) => t.f)))
    for (const { p: q } of a.members.get(f) ?? []) if (q.id !== p.id) shared.set(q.id, [...new Set([...(shared.get(q.id) ?? []), a.faction.get(f)!])])
  ;[...shared]
    .map(([id, fs]) => ({ q: a.person.get(id)!, fs }))
    .sort((x, y) => y.fs.length - x.fs.length || weight(y.q) - weight(x.q))
    .filter(({ q }) => !nodes.has(q.id))
    .slice(0, CAP.faction)
    .forEach(({ q, fs }) => add(q, { kind: 'faction', text: fs.map((f) => f.name).join('、'), color: fs[0].color }))

  const together = new Map<string, string[]>()
  for (const e of a.eventsOf.get(p.id) ?? []) for (const id of e.people) if (id !== p.id) together.set(id, [...(together.get(id) ?? []), e.title])
  ;[...together]
    .map(([id, titles]) => ({ q: a.person.get(id), titles }))
    .filter((x): x is { q: PersonR; titles: string[] } => !!x.q && !nodes.has(x.q.id))
    .sort((x, y) => y.titles.length - x.titles.length || weight(y.q) - weight(x.q))
    .slice(0, CAP.event)
    .forEach(({ q, titles }) => add(q, { kind: 'event', text: titles.slice(0, 3).join('；') + (titles.length > 3 ? ` 等 ${titles.length} 件` : '') }))

  const rank = (n: Node) => Math.min(...n.links.map((l) => ORDER.indexOf(l.kind)))
  return [...nodes.values()].sort((x, y) => rank(x) - rank(y)).slice(0, CAP.family + CAP.faction + CAP.event)
}

export function Network({ p }: { p: PersonR }) {
  const a = useAtlas()
  const nodes = relations(a, p)
  if (!nodes.length) return null
  return (
    <Section title="人物关系" note="家属、同派系标签、同一事件中出现的人；不代表彼此有私人交往">
      <Graph p={p} nodes={nodes} />
    </Section>
  )
}

function Graph({ p, nodes }: { p: PersonR; nodes: Node[] }) {
  const tip = useTip()
  const kinds = ORDER.filter((k) => nodes.some((n) => n.links[0].kind === k))
  // each node with its label needs about 66 units of arc
  const r = Math.max(R, (nodes.length * 66) / (2 * Math.PI))
  const half = r + NODE + 34
  const at = (i: number) => {
    const t = -Math.PI / 2 + (2 * Math.PI * i) / nodes.length
    return [r * Math.cos(t), r * Math.sin(t)] as const
  }
  const stroke = (l: Link) => (l.kind === 'family' ? 'var(--red)' : l.kind === 'faction' ? (l.color ?? 'var(--gold)') : 'var(--muted)')

  return (
    <div className="card pad network">
      <svg viewBox={`${-half - 20} ${-half} ${2 * half + 40} ${2 * half + 10}`} role="img" aria-label={`${p.name}的人物关系`}>
        <defs>
          <clipPath id="net-c">
            <circle r={NODE} />
          </clipPath>
          <clipPath id="net-me">
            <circle r={40} />
          </clipPath>
        </defs>
        {nodes.map((n, i) => {
          const [x, y] = at(i)
          const l = n.links[0]
          return <line key={n.p.id} x1={0} y1={0} x2={x} y2={y} stroke={stroke(l)} strokeWidth={l.kind === 'family' ? 3 : 1.6} strokeDasharray={l.kind === 'event' ? '3 4' : undefined} opacity={0.75} />
        })}
        <Face p={p} r={40} clip="net-me" />
        {nodes.map((n, i) => {
          const [x, y] = at(i)
          return (
            <g
              key={n.p.id}
              className="net-node"
              transform={`translate(${x},${y})`}
              onClick={() => go(personHref(n.p.id))}
              onMouseMove={(e) =>
                tip.show(
                  e,
                  <>
                    <b>{n.p.name}</b>
                    <div className="m">{n.p.headline}</div>
                    {n.links.map((l, j) => (
                      <div key={j} style={{ marginTop: 4 }}>
                        <span style={{ color: l.kind === 'faction' ? l.color : undefined, fontWeight: 700 }}>{LABEL[l.kind]}</span> {l.text}
                      </div>
                    ))}
                  </>,
                )
              }
              onMouseLeave={tip.hide}
              role="link"
              tabIndex={0}
              aria-label={n.p.name}
              onKeyDown={(e) => e.key === 'Enter' && go(personHref(n.p.id))}
            >
              <circle r={NODE + 3} fill={stroke(n.links[0])} />
              <Face p={n.p} r={NODE} clip="net-c" />
              <text y={NODE + 15} textAnchor="middle" className="net-name">
                {n.p.name}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="legend small">
        {kinds.map((k) => (
          <span key={k}>
            <i className={`net-key ${k}`} />
            {LABEL[k]}
            {k === 'faction' && '（按派系着色）'} {nodes.filter((n) => n.links[0].kind === k).length}
          </span>
        ))}
        <span className="muted">悬停看关系，点击进入人物页</span>
      </div>
      {tip.node}
    </div>
  )
}

function Face({ p, r, clip }: { p: PersonR; r: number; clip: string }) {
  const fallen = p.status === 'purged' || p.status === 'detained'
  return (
    <>
      <circle r={r} fill="var(--card)" />
      {p.photo?.src ? (
        <image href={p.photo.src} x={-r} y={-r} width={r * 2} height={r * 2} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMin slice" style={{ filter: fallen ? 'grayscale(1)' : undefined }} />
      ) : (
        <text textAnchor="middle" dy="0.36em" fontSize={r * 0.8} fontFamily="var(--serif)" fontWeight={900} fill="var(--ink-2)">
          {p.name.slice(0, 1)}
        </text>
      )}
    </>
  )
}

// What the faction views derive from the tags, positions, seats and relations of a faction's people.
import type { Atlas, PersonR } from '../data/db'
import type { Faction, FactionTag, Rank } from '../data/schema'
import { fy } from './dates'

export const RING_ORDER: Rank[] = ['elder', 'core', 'backbone', 'periphery']
export const NOW = new Date().getFullYear() + new Date().getMonth() / 12

export interface Member {
  p: PersonR
  tags: FactionTag[]
  rank: Rank
  // where the rank comes from: a sentence in a source, the editor of a batch, or this page's fallback by office
  rankBy: 'source' | 'editor' | 'auto'
  rankTag?: FactionTag
}

// the highest office ever held: 4 standing committee, 3 politburo, 2 central committee or minister, 1 other
export function level(a: Atlas, p: PersonR): number {
  const seats = a.seats.get(p.id) ?? []
  if (seats.some((s) => s.seat === 'gs' || s.seat === 'psc')) return 4
  if (seats.some((s) => s.seat === 'pb' || s.seat === 'cmc')) return 3
  if (a.ccOf.has(p.id) || p.roles.some((r) => r === 'cc' || r === 'prov' || r === 'minister' || r === 'general' || r === 'pb' || r === 'psc')) return 2
  return 1
}

export function centre(f: Faction): string | undefined {
  return f.patron ?? f.core[0]
}

export function membersOf(a: Atlas, f: Faction): Member[] {
  const by = new Map<string, FactionTag[]>()
  for (const { p, tag } of a.members.get(f.id) ?? []) by.set(p.id, [...(by.get(p.id) ?? []), tag])
  for (const id of f.core) if (a.person.has(id) && !by.has(id)) by.set(id, [])
  const mid = centre(f)
  return [...by]
    .filter(([id]) => id !== mid)
    .map(([id, tags]) => {
      const p = a.person.get(id)!
      const quoted = tags.find((t) => t.rank && t.rankQuote)
      const ranked = quoted ?? tags.find((t) => t.rank)
      if (ranked) return { p, tags, rank: ranked.rank!, rankBy: quoted ? 'source' : 'editor', rankTag: ranked } as Member
      const lv = level(a, p)
      const rank: Rank = f.core.includes(id) || lv >= 3 ? 'core' : lv === 2 ? 'backbone' : 'periphery'
      return { p, tags, rank, rankBy: 'auto' } as Member
    })
}

// for labels in tight charts: 周永康系（石油、四川、政法） → 周永康系
export const shortName = (f: Faction) => f.name.replace(/[（(].*[）)]$/, '') || f.name

// everyone the faction names, its centre included
export function peopleIn(a: Atlas, f: Faction): string[] {
  const mid = centre(f)
  return [...new Set([...(mid && a.person.has(mid) ? [mid] : []), ...membersOf(a, f).map((m) => m.p.id)])]
}

const year = (d?: string) => fy(d)

// in office in year y: a position covering y, or a seat in a congress term covering y
export function activeIn(a: Atlas, p: PersonR, y: number): boolean {
  if (p.positions.some((x) => (year(x.from) ?? -Infinity) <= y + 1 && (year(x.to) ?? (x.from ? NOW : -Infinity)) >= y)) return true
  const terms = a.db.congresses
  return (a.seats.get(p.id) ?? []).some((s) => {
    const c = terms.find((t) => t.n === s.n)
    const next = terms.find((t) => t.n === s.n + 1)
    return !!c && (fy(c.opened) ?? 0) <= y + 1 && (next ? (fy(next.opened) ?? NOW) : NOW) >= y
  })
}

export function fallYear(p: PersonR): number | undefined {
  return p.fall.length ? fy(p.fall[0].date) : undefined
}

// province of a position, in the short form of the map: 浙江省 → 浙江
export const province = (s?: string) => s?.replace(/(维吾尔|壮族|回族)?自治区$|特别行政区$|省$|市$/, '')

export interface Stint { place: string; from: number; to: number; title: string }

export function stints(p: PersonR): Stint[] {
  return p.positions
    .filter((x) => x.place && x.from)
    .map((x) => ({ place: province(x.place)!, from: year(x.from)!, to: year(x.to) ?? NOW, title: x.title }))
}

// the years a member served in the same province as the centre of the faction
export function overlaps(centreStints: Stint[], m: Stint[]) {
  const out: { place: string; from: number; to: number; title: string; with: string }[] = []
  for (const s of m)
    for (const c of centreStints) {
      if (s.place !== c.place) continue
      const from = Math.max(s.from, c.from)
      const to = Math.min(s.to, c.to)
      if (to > from) out.push({ place: s.place, from, to, title: s.title, with: c.title })
    }
  return out
}

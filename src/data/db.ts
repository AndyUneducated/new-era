// The shape of public/data/db.json (tools/build/emit.ts) and the lookups every view shares.
import type { Concept, Congress, CorpusDoc, Event, Faction, FactionTag, Frame, Person, Quote, Source } from './schema'

export type PersonR = Person & { quotes: Quote[] }
export type CorpusR = CorpusDoc & { title: string; chars: number; counts: Record<string, number> }
export type SourceR = Source & { chars: number }

export interface DB {
  built: string
  people: PersonR[]
  factions: Faction[]
  events: Event[]
  concepts: Concept[]
  congresses: Congress[]
  corpus: CorpusR[]
  sources: SourceR[]
}

export type Seat = 'gs' | 'psc' | 'pb' | 'alt' | 'sec' | 'cmc'
export const SEATS: Record<Seat, string> = { gs: '总书记', psc: '常委', pb: '政治局委员', alt: '候补委员', sec: '书记处书记', cmc: '军委' }

export interface Membership { n: number; seat: Seat; title?: string }

export class Atlas {
  db: DB
  person = new Map<string, PersonR>()
  faction = new Map<string, Faction>()
  event = new Map<string, Event>()
  concept = new Map<string, Concept>()
  source = new Map<string, SourceR>()
  congress = new Map<number, Congress>()
  members = new Map<string, { p: PersonR; tag: FactionTag }[]>()
  eventsOf = new Map<string, Event[]>()
  seats = new Map<string, Membership[]>()

  constructor(db: DB) {
    this.db = db
    for (const p of db.people) this.person.set(p.id, p)
    for (const f of db.factions) this.faction.set(f.id, f)
    for (const e of db.events) this.event.set(e.id, e)
    for (const c of db.concepts) this.concept.set(c.id, c)
    for (const s of db.sources) this.source.set(s.id, s)
    for (const c of db.congresses) this.congress.set(c.n, c)
    for (const p of db.people)
      for (const tag of p.factions) push(this.members, tag.f, { p, tag })
    for (const e of db.events) for (const id of [...e.people, ...e.factions, ...e.concepts]) push(this.eventsOf, id, e)
    for (const c of db.congresses) {
      const add = (id: string, seat: Seat, title?: string) => push(this.seats, id, { n: c.n, seat, title })
      c.psc.forEach((id) => add(id, id === c.gs ? 'gs' : 'psc'))
      c.pb.forEach((id) => add(id, 'pb'))
      c.alt.forEach((id) => add(id, 'alt'))
      c.sec.forEach((id) => add(id, 'sec'))
      c.cmc.forEach((m) => add(m.id, 'cmc', m.title))
    }
  }

  // the person's faction in one frame; the first tag wins
  factionIn(p: PersonR, frame: Frame): Faction | undefined {
    for (const t of p.factions) {
      const f = this.faction.get(t.f)
      if (f?.frame === frame) return f
    }
  }

  name(id: string) {
    return this.person.get(id)?.name ?? this.faction.get(id)?.name ?? this.concept.get(id)?.name ?? id
  }
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const a = m.get(k)
  if (a) a.push(v)
  else m.set(k, [v])
}

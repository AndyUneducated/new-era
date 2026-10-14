// The shape of public/data/db.json (tools/build/emit.ts) and the lookups every view shares.
import type { Chapter, Chief, Concept, Congress, CorpusDoc, Event, Faction, FactionTag, Frame, Ism, LinePoint, Person, PressTerm, Quote, Relation, Source } from './schema'

export type PersonR = Person & { quotes: Quote[] }
// counts: concept id → occurrences; isms and press the same for isms and press terms
export type CorpusR = CorpusDoc & { title: string; chars: number; counts: Record<string, number>; isms: Record<string, number>; press: Record<string, number> }
export type SourceR = Source & { chars: number }

export interface DB {
  built: string
  people: PersonR[]
  factions: Faction[]
  events: Event[]
  relations: Relation[]
  concepts: Concept[]
  congresses: Congress[]
  corpus: CorpusR[]
  isms: Ism[]
  line: LinePoint[]
  press: PressTerm[]
  story: Chapter[]
  chiefs: Chief[]
  // growth targets read from the government work reports (tools/build/emit.ts); lo and hi are null when none was set
  targets: { year: number; label: string; lo: number | null; hi: number | null; quote: string; cite: string }[]
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
  ties = new Map<string, Relation[]>()
  // central committee terms by person, from the name lists
  ccOf = new Map<string, { n: number; alt: boolean }[]>()
  ism = new Map<string, Ism>()
  // unique names only; namesakes map to null
  private byName = new Map<string, string | null>()

  // a name on a central committee list; the lists keep disambiguating notes for namesakes: 张军（国家机关）
  ccId(name: string, c?: Congress): string | undefined {
    return c?.names?.[name] ?? this.byName.get(name) ?? this.byName.get(name.replace(/（[^）]*）$/, '')) ?? undefined
  }

  constructor(db: DB) {
    this.db = db
    db.isms ??= []
    db.line ??= []
    db.press ??= []
    db.story ??= []
    db.chiefs ??= []
    db.targets ??= []
    for (const m of db.isms) this.ism.set(m.id, m)
    for (const p of db.people) this.person.set(p.id, p)
    for (const r of db.relations ?? []) {
      push(this.ties, r.a, r)
      push(this.ties, r.b, r)
    }
    for (const p of db.people) this.byName.set(p.name, this.byName.has(p.name) ? null : p.id)
    for (const c of db.congresses)
      for (const [list, alt] of [[c.cc ?? [], false], [c.cca ?? [], true]] as const)
        for (const name of list) {
          const id = this.ccId(name, c)
          if (id) push(this.ccOf, id, { n: c.n, alt })
        }
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
    return this.person.get(id)?.name ?? this.faction.get(id)?.name ?? this.concept.get(id)?.name ?? this.ism.get(id)?.name ?? id
  }
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const a = m.get(k)
  if (a) a.push(v)
  else m.set(k, [v])
}

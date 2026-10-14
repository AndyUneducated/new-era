// Stage 3: derive what the views need and write public/data/db.json.
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from './io.ts'
import type { Data } from './load.ts'

const count = (hay: string, needle: string) => {
  let n = 0
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) n++
  return n
}

export function compile(d: Data) {
  // term frequency: each concept's terms counted in each corpus text, per 10 000 characters
  const corpus = d.corpus
    .map((c) => {
      const text = d.texts.get(c.id) ?? ''
      const chars = text.replace(/\s/g, '').length
      const counts: Record<string, number> = {}
      for (const k of d.concepts) {
        const n = (k.terms.length ? k.terms : [k.name]).reduce((a, t) => a + count(text, t), 0)
        if (n) counts[k.id] = n
      }
      return { ...c, title: d.sourceById.get(c.id)?.title ?? c.id, chars, counts }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  // events and factions may name planned people who have no entry yet; the browser only sees real ones
  const known = new Set(d.people.map((p) => p.id))
  const events = d.events.map((e) => ({ ...e, people: e.people.filter((id) => known.has(id)) }))
  const factions = d.factions.map((f) => ({ ...f, core: f.core.filter((id) => known.has(id)) }))
  const fids = new Set(d.factions.map((f) => f.id))
  for (const p of d.people) p.factions = p.factions.filter((t) => fids.has(t.f))
  const cids = new Set(d.concepts.map((c) => c.id))
  for (const e of events) {
    e.factions = e.factions.filter((id) => fids.has(id))
    e.concepts = e.concepts.filter((id) => cids.has(id))
  }
  const people = d.people.map((p) => {
    const wd = p.ids.wikidata ? d.wikidata.get(p.ids.wikidata) : undefined
    return {
      ...p,
      born: p.born ?? wd?.born,
      died: p.died ?? wd?.died,
      birthplace: p.birthplace ?? wd?.birthplace,
      quotes: d.quotes.get(p.id) ?? [],
    }
  })
  const sources = d.sources.map((s) => ({ ...s, chars: d.texts.get(s.id)?.length ?? 0 }))
  return {
    built: new Date().toISOString().slice(0, 10),
    people,
    factions,
    events: events.sort((a, b) => a.date.localeCompare(b.date)),
    relations: d.relations.filter((r) => known.has(r.a) && known.has(r.b)),
    concepts: d.concepts.map((c) => ({ ...c, by: c.by.filter((id) => known.has(id)) })),
    congresses: [...d.congresses].sort((a, b) => a.n - b.n),
    corpus,
    sources,
  }
}
export type DB = ReturnType<typeof compile>

export function write(db: DB) {
  mkdirSync(path('public', 'data'), { recursive: true })
  writeFileSync(path('public', 'data', 'db.json'), JSON.stringify(db))
}

export function stats(db: DB) {
  const t1 = db.people.filter((p) => p.tier === 1).length
  const q = db.people.reduce((a, p) => a + p.quotes.length, 0)
  const tags = db.people.reduce((a, p) => a + p.factions.length, 0)
  const photos = db.people.filter((p) => p.photo).length
  return [
    `people ${db.people.length} (full ${t1}, cards ${db.people.length - t1}), photos ${photos}, quotes ${q}, faction tags ${tags}`,
    `factions ${db.factions.length}, events ${db.events.length}, concepts ${db.concepts.length}, congresses ${db.congresses.length}, relations ${db.relations.length}`,
    `sources ${db.sources.length} (with text ${db.sources.filter((s) => s.hasText).length}), corpus ${db.corpus.length}`,
  ].join('\n')
}

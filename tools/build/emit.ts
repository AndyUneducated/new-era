// Stage 3: derive what the views need and write public/data/db.json.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { parseFall } from '../../src/lib/caseparse.ts'
import { path } from './io.ts'
import type { Data } from './load.ts'

// an overlay record without the name of the file it came from
const strip = <T extends { file: string }>(r?: T): Omit<T, 'file'> | undefined => {
  if (!r) return undefined
  const { file: _, ...rest } = r
  return rest
}

const count = (hay: string, needle: string) => {
  let n = 0
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) n++
  return n
}

// occurrences of the terms, less those inside a longer `except` string
const hits = (text: string, terms: string[], except: string[] = []) =>
  terms.reduce((a, t) => a + count(text, t), 0) - except.reduce((a, e) => a + terms.filter((t) => e.includes(t)).length * count(text, e), 0)

const tally = (text: string, list: { id: string; name: string; terms: string[]; except?: string[] }[]) => {
  const out: Record<string, number> = {}
  for (const k of list) {
    const n = hits(text, k.terms.length ? k.terms : [k.name], k.except)
    if (n > 0) out[k.id] = n
  }
  return out
}

// the growth target of each government work report, read from the text with the sentence that states it
const WIDE = (s: string) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/．/g, '.').replace(/％/g, '%')
const TARGET = [/(?:主要|预期)目标(?:是|为)?：[^。]*?(?:国内生产总值|经济)增长\s*([0-9０-９.．]+\s*[%％]?(?:\s*[-－—～]\s*[0-9０-９.．]+)?\s*[%％](?:左右|以上)?)/, /经济增长预期目标为\s*([0-9０-９.．]+\s*[%％]左右)/]
const NO_TARGET = /没有提出全年经济增速具体目标/
interface Target { year: number; label: string; lo: number | null; hi: number | null; quote: string; cite: string }
function growthTargets(d: Data): Target[] {
  return d.corpus
    .filter((c) => c.kind === 'gov')
    .flatMap((c): Target[] => {
      const text = d.texts.get(c.id) ?? ''
      const sentence = (i: number) => text.slice(text.lastIndexOf('。', i) + 1, text.indexOf('。', i) + 1).trim()
      const year = Number(c.date.slice(0, 4))
      const none = text.search(NO_TARGET)
      if (none >= 0) return [{ year, label: '未设目标', lo: null, hi: null, quote: sentence(none), cite: c.id }]
      for (const re of TARGET) {
        const m = re.exec(text)
        if (!m) continue
        const label = WIDE(m[1]).replace(/\s/g, '')
        const nums = [...label.matchAll(/\d+(?:\.\d+)?/g)].map((x) => Number(x[0]))
        return [{ year, label, lo: nums[0], hi: nums[1] ?? nums[0], quote: sentence(m.index + m[0].length - 1), cite: c.id }]
      }
      return []
    })
}

// a chief written by name only, because the card was being written in the same round: the one person of
// that name whose career touches the province
function chiefPerson(d: Data, c: Data['chiefs'][number]) {
  const here = d.people.filter((p) => p.name === c.name && (p.positions.some((x) => x.place?.startsWith(c.prov) || x.title.startsWith(c.prov)) || p.bio.includes(c.prov)))
  if (here.length === 1) return here[0].id
}

// batches running in parallel enter the same tie; the browser gets one, the one with a quote if any
function uniqueRelations(list: Data['relations']) {
  const by = new Map<string, Data['relations'][number]>()
  for (const r of list) {
    const key = [r.kind, ...(r.kind === 'colleague' || r.kind === 'kin' || r.kind === 'rival' ? [r.a, r.b].sort() : [r.a, r.b])].join(' ')
    const had = by.get(key)
    if (!had || (!had.quote && r.quote)) by.set(key, r)
  }
  return [...by.values()]
}

export function compile(d: Data) {
  // term frequency: each concept's, ism's and press term's strings counted in each corpus text
  const corpus = d.corpus
    .map((c) => {
      const text = d.texts.get(c.id) ?? ''
      const chars = text.replace(/\s/g, '').length
      return { ...c, title: d.sourceById.get(c.id)?.title ?? c.id, chars, counts: tally(text, d.concepts), isms: tally(text, d.isms), press: tally(text, d.press) }
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
    const rec = d.falls.get(p.id)
    const turn = d.turns.get(p.id)
    return {
      ...p,
      born: p.born ?? wd?.born,
      died: p.died ?? wd?.died,
      birthplace: p.birthplace ?? wd?.birthplace,
      quotes: d.quotes.get(p.id) ?? [],
      case:
        p.fall.length || rec
          ? {
              ...strip(rec),
              ...parseFall(p.fall, p.status, rec, (c) => d.texts.get(c.split('@')[0]), p.name),
              fall: undefined,
              with: (rec?.with ?? []).map((x) => ({ ...x, id: x.id && known.has(x.id) ? x.id : undefined })),
              voices: rec?.voices ?? [],
              discipline: rec?.discipline ?? [],
            }
          : undefined,
      turn: turn ? { ...strip(turn), turns: turn.turns.map((t) => ({ ...t, who: t.who.filter((id) => known.has(id)) })) } : undefined,
    }
  })
  const sources = d.sources.map((s) => ({ ...s, chars: d.texts.get(s.id)?.length ?? 0 }))
  return {
    built: new Date().toISOString().slice(0, 10),
    people,
    factions,
    events: events.sort((a, b) => a.date.localeCompare(b.date)),
    relations: uniqueRelations(d.relations.filter((r) => known.has(r.a) && known.has(r.b))),
    concepts: d.concepts.map((c) => ({ ...c, by: c.by.filter((id) => known.has(id)) })),
    congresses: [...d.congresses].sort((a, b) => a.n - b.n),
    corpus,
    isms: d.isms.map((m) => ({ ...m, carriers: m.carriers.filter((id) => known.has(id)), concept: m.concept && cids.has(m.concept) ? m.concept : undefined })),
    line: [...d.line].sort((a, b) => a.at.localeCompare(b.at)),
    press: d.press,
    targets: growthTargets(d),
    story: d.story,
    chiefs: d.chiefs.map((c) => ({ ...c, person: c.person && known.has(c.person) ? c.person : chiefPerson(d, c) })).sort((a, b) => a.prov.localeCompare(b.prov) || a.post.localeCompare(b.post) || a.from.localeCompare(b.from)),
    cases: d.cases.map((c) => ({ ...c, people: c.people.filter((id) => known.has(id)), events: c.events.filter((id) => d.events.some((e) => e.id === id)) })),
    sources,
  }
}
export type DB = ReturnType<typeof compile>

// the versions reader fetches whole charters and constitutions; other texts stay out of the site
export const VERSIONED = ['charter', 'constitution'] as const

const omit = <T extends object, K extends keyof T>(o: T, keys: readonly K[]) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => !(keys as readonly PropertyKey[]).includes(k))) as Omit<T, K>

export function write(db: DB, d: Data) {
  mkdirSync(path('public', 'data', 'texts'), { recursive: true })
  // long texts shown on one page only load after the first paint (src/lib/more.ts): biographies and
  // assessments, the sections of concepts and case studies, the titles and links of sources
  const core = {
    ...db,
    people: db.people.map((p) => omit(p, ['bio', 'life', 'assess'])),
    concepts: db.concepts.map((c) => omit(c, ['sections'])),
    cases: db.cases.map((c) => omit(c, ['sections'])),
    sources: db.sources.map((s) => omit(s, ['title', 'url', 'author', 'lang', 'excerpt', 'hasText', 'chars'])),
  }
  const more = {
    people: Object.fromEntries(db.people.map((p) => [p.id, { bio: p.bio, life: p.life, assess: p.assess }])),
    concepts: Object.fromEntries(db.concepts.map((c) => [c.id, c.sections])),
    cases: Object.fromEntries(db.cases.map((c) => [c.id, c.sections])),
    sources: Object.fromEntries(db.sources.map((s) => [s.id, { title: s.title, url: s.url, author: s.author }])),
  }
  writeFileSync(path('public', 'data', 'db.json'), JSON.stringify(core))
  writeFileSync(path('public', 'data', 'more.json'), JSON.stringify(more))
  rmSync(path('public', 'data', 'lives.json'), { force: true })
  for (const c of d.corpus) {
    const text = d.texts.get(c.id)
    if (text && (VERSIONED as readonly string[]).includes(c.kind)) writeFileSync(path('public', 'data', 'texts', `${c.id}.txt`), text)
  }
}

export function stats(db: DB) {
  const t1 = db.people.filter((p) => p.tier === 1).length
  const q = db.people.reduce((a, p) => a + p.quotes.length, 0)
  const tags = db.people.reduce((a, p) => a + p.factions.length, 0)
  const photos = db.people.filter((p) => p.photo).length
  const fallen = db.people.filter((p) => p.case)
  return [
    `people ${db.people.length} (full ${t1}, cards ${db.people.length - t1}), photos ${photos}, quotes ${q}, faction tags ${tags}`,
    `falls ${fallen.length} (case records ${fallen.filter((p) => p.case?.sys).length}, sentenced ${fallen.filter((p) => p.case?.term).length}, sums ${fallen.filter((p) => p.case?.yuan).length}), case studies ${db.cases.length}, turning points ${db.people.filter((p) => p.turn).length}`,
    `factions ${db.factions.length}, events ${db.events.length}, concepts ${db.concepts.length}, congresses ${db.congresses.length}, relations ${db.relations.length}`,
    `sources ${db.sources.length} (with text ${db.sources.filter((s) => s.hasText).length}), corpus ${db.corpus.length}, isms ${db.isms.length}, line ${db.line.length}, press terms ${db.press.length}`,
  ].join('\n')
}

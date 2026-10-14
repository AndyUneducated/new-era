// Stage 1: read every YAML file and source text and validate each record against its schema.
import { readdirSync, readFileSync } from 'node:fs'
import { z } from 'zod'
import {
  ChapterSchema,
  ConceptSchema,
  CongressSchema,
  CorpusDocSchema,
  EventSchema,
  FactionSchema,
  FactionTagSchema,
  IsmSchema,
  LinePointSchema,
  PersonSchema,
  PressTermSchema,
  PhotoSchema,
  QuoteSchema,
  RelationSchema,
  SourceSchema,
  VoicedSchema,
  type FactionTag,
  type Quote,
  type Source,
} from '../../src/data/schema.ts'
import { errors, exists, load, otherInflight, path, read, yamlFiles } from './io.ts'

export type Data = ReturnType<typeof loadAll>

export type WikidataRec = {
  qid: string
  label?: string
  description?: string
  born?: string
  died?: string
  birthplace?: string
  image?: string
  positions?: { label: string; from?: string; to?: string }[]
}

// a Wikidata record is a source too (CC0): its text is the record rendered as lines, so facts can be quoted
export function wikidataText(r: WikidataRec): string {
  const lines = [r.label, r.description, r.born && `出生 ${r.born}`, r.died && `去世 ${r.died}`, r.birthplace && `出生地 ${r.birthplace}`]
  for (const p of r.positions ?? []) lines.push(`${p.label}${p.from ? ` ${p.from}` : ''}${p.to ? `–${p.to}` : ''}`)
  return lines.filter(Boolean).join('\n')
}

function loadSources() {
  const hasText = (id: string) => exists('sources', 'text', `${id}.txt`)
  const sources: Source[] = yamlFiles('research', 'manifests').flatMap((p) => {
    let m: { web?: Record<string, unknown>[] }
    try {
      m = read(...p) ?? {}
    } catch (e) {
      if (otherInflight(p[2])) return []
      throw e
    }
    // start/end/keep/article only steer the fetcher
    const web = (m.web ?? []).map(({ start, end, keep, article, ...s }) => ({ ...s, hasText: hasText(String(s.id)) }))
    if (otherInflight(p[2])) return web.filter((s) => SourceSchema.safeParse(s).success) as Source[]
    return load(SourceSchema, web, p.join('/'))
  })
  const texts = new Map<string, string>()
  for (const s of sources) if (s.hasText) texts.set(s.id, readFileSync(path('sources', 'text', `${s.id}.txt`), 'utf8'))

  const wikidata = new Map<string, WikidataRec>()
  if (exists('research', 'wikidata'))
    for (const f of readdirSync(path('research', 'wikidata')).filter((f) => f.endsWith('.json'))) {
      const r = JSON.parse(readFileSync(path('research', 'wikidata', f), 'utf8')) as WikidataRec
      wikidata.set(r.qid, r)
      const id = `wd-${r.qid}`
      sources.push({ id, title: `Wikidata ${r.qid}${r.label ? `（${r.label}）` : ''}`, publisher: 'Wikidata', voice: 'wiki', url: `https://www.wikidata.org/wiki/${r.qid}`, lang: 'zh', hasText: true })
      texts.set(id, wikidataText(r))
    }
  const seen = new Set<string>()
  for (const s of sources) {
    if (seen.has(s.id)) errors.push(`source id ${s.id} registered twice`)
    seen.add(s.id)
  }
  return { sources, sourceById: new Map(sources.map((s) => [s.id, s])), texts, wikidata }
}

function loadPeople() {
  const people = yamlFiles('content', 'people').flatMap((p) => load(PersonSchema, read(...p), p.join('/')))
  // quotes are kept apart from the biographies: content/quotes/*.yaml maps person id → quotes
  const quotes = new Map<string, Quote[]>()
  for (const f of yamlFiles('content', 'quotes'))
    for (const [id, list] of Object.entries((read(...f) ?? {}) as Record<string, unknown[]>))
      quotes.set(id, [...(quotes.get(id) ?? []), ...load(QuoteSchema, list, `${f.join('/')} ${id}`)])
  // faction labels may also be kept apart: content/tags/*.yaml maps person id → labels
  for (const f of yamlFiles('content', 'tags'))
    for (const [id, list] of Object.entries((read(...f) ?? {}) as Record<string, unknown[]>)) {
      const p = people.find((x) => x.id === id)
      const tags = load(FactionTagSchema, list, `${f.join('/')} ${id}`)
      if (!p) {
        pendingTags.set(id, [...(pendingTags.get(id) ?? []), ...tags])
        continue
      }
      // a later batch may repeat a label only to give it a rank
      for (const t of tags) {
        const same = p.factions.find((x) => x.f === t.f && x.cite === t.cite)
        if (!same) p.factions.push(t)
        else {
          same.rank ??= t.rank
          same.rankQuote ??= t.rankQuote
        }
      }
    }
  // and so may assessments: content/assess/*.yaml maps person id → voices
  for (const f of yamlFiles('content', 'assess'))
    for (const [id, list] of Object.entries((read(...f) ?? {}) as Record<string, unknown[]>)) {
      const p = people.find((x) => x.id === id)
      const vs = load(VoicedSchema, list, `${f.join('/')} ${id}`)
      if (p) p.assess.push(...vs)
      else pendingAssess.set(id, [...(pendingAssess.get(id) ?? []), ...vs])
    }
  const photos = exists('content', 'photos.yaml') ? (read('content', 'photos.yaml') ?? {}) : {}
  for (const p of people) {
    const r = PhotoSchema.safeParse(photos[p.id])
    if (!r.success || !r.data.file) continue
    const file = ['jpg', 'png', 'webp'].map((x) => `${p.id}.${x}`).find((f) => exists('public', 'photos', f))
    if (file) p.photo = { src: `photos/${file}`, url: r.data.url, author: r.data.author, license: r.data.license, date: r.data.date, focus: r.data.focus }
  }
  return { people, quotes, pendingTags, pendingAssess }
}

// research/roster.yaml: every planned person, with the batch that owns the entry. A reference to a planned
// person who has no entry yet is a warning, not an error, so batches can be written in parallel.
const RosterSchema = z.object({ id: z.string(), name: z.string(), batch: z.string(), tier: z.union([z.literal(1), z.literal(2)]) })
// from round three each batch also plans its new people in research/roster/<batch>.yaml, read for every batch
function loadRoster() {
  const main = exists('research', 'roster.yaml') ? load(RosterSchema, read('research', 'roster.yaml'), 'roster') : []
  const own = exists('research', 'roster')
    ? readdirSync(path('research', 'roster'))
        .filter((f) => f.endsWith('.yaml'))
        .flatMap((f) => load(RosterSchema, read('research', 'roster', f) ?? [], `research/roster/${f}`))
    : []
  return [...main, ...own]
}
const pendingTags = new Map<string, FactionTag[]>()
const pendingAssess = new Map<string, z.infer<typeof VoicedSchema>[]>()

export function loadAll() {
  // every kind of record lives in its own directory, one file per batch
  const dir = <T extends z.ZodType>(schema: T, name: string) => yamlFiles('content', name).flatMap((p) => load(schema, read(...p), p.join('/')))
  const factions = dir(FactionSchema, 'factions')
  // later batches add voices to factions they do not own: content/faction-voices/*.yaml maps faction id → voices
  for (const f of yamlFiles('content', 'faction-voices'))
    for (const [id, list] of Object.entries((read(...f) ?? {}) as Record<string, unknown[]>)) {
      const vs = load(VoicedSchema, list, `${f.join('/')} ${id}`)
      const x = factions.find((y) => y.id === id)
      if (x) x.voices.push(...vs)
      else errors.push(`${f.join('/')}: no faction ${id}`)
    }
  return {
    ...loadSources(),
    ...loadPeople(),
    roster: loadRoster(),
    conceptPlan: exists('research', 'concept-plan.yaml') ? load(z.object({ id: z.string(), name: z.string() }), read('research', 'concept-plan.yaml'), 'concept-plan') : [],
    factionPlan: exists('research', 'faction-plan.yaml') ? load(z.object({ id: z.string(), name: z.string(), frame: z.string() }), read('research', 'faction-plan.yaml'), 'faction-plan') : [],
    factions,
    events: dir(EventSchema, 'events'),
    relations: dir(RelationSchema, 'relations'),
    concepts: dir(ConceptSchema, 'concepts'),
    congresses: dir(CongressSchema, 'congresses'),
    corpus: dir(CorpusDocSchema, 'corpus'),
    isms: dir(IsmSchema, 'isms'),
    line: dir(LinePointSchema, 'line'),
    press: dir(PressTermSchema, 'press'),
    story: dir(ChapterSchema, 'story'),
  }
}

// Stage 2: unique ids, references between records, cited sources, verbatim quotes.
import { FACTION_VOICES } from '../../src/data/schema.ts'
import { quoteMisses } from '../../src/lib/quotes.ts'
import { errors, warnings } from './io.ts'
import type { Data } from './load.ts'

export function check(d: Data) {
  const unique = (kind: string, ids: string[]) => {
    const seen = new Set<string>()
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${kind} id ${id} used twice`)
      seen.add(id)
    }
    return seen
  }
  const people = unique('person', d.people.map((p) => p.id))
  const factions = unique('faction', d.factions.map((f) => f.id))
  const concepts = unique('concept', d.concepts.map((c) => c.id))
  unique('event', d.events.map((e) => e.id))

  const planned = new Set(d.roster.map((r) => r.id))
  for (const r of d.roster) if (!people.has(r.id)) warnings.push(`roster: ${r.id} (${r.batch}) has no entry yet`)
  for (const id of d.pendingTags.keys())
    if (planned.has(id)) warnings.push(`tags for ${id} wait for the entry`)
    else errors.push(`content/tags: no person ${id}`)
  const plannedFactions = new Set(d.factionPlan.map((f) => f.id))
  const plannedConcepts = new Set(d.conceptPlan.map((c) => c.id))
  const ref = (set: Set<string>, kind: string, id: string, where: string) => {
    if (set.has(id)) return
    if ((set === people && planned.has(id)) || (set === factions && plannedFactions.has(id)) || (set === concepts && plannedConcepts.has(id))) warnings.push(`${where}: ${kind} ${id} is planned but has no entry yet`)
    else errors.push(`${where}: unknown ${kind} "${id}"`)
  }
  // every cite must name a registered source that has text in the library (decisions #3)
  const cite = (c: string, where: string) => {
    const id = c.split('@')[0]
    const s = d.sourceById.get(id)
    if (!s) errors.push(`${where}: unknown source "${id}"`)
    else if (!s.hasText) errors.push(`${where}: source ${id} has no text (run npm run data:fetch ${id})`)
    return s
  }
  const quote = (c: string, q: string, where: string) => {
    const body = d.texts.get(c.split('@')[0])
    if (!body) return
    for (const part of quoteMisses(body, q)) errors.push(`${where}: quote not found in ${c}: "${part.slice(0, 50)}"`)
  }
  // prose: a passage in “” of eight characters or more is a quote from one of the passage's cites;
  // shorter ones are terms and slogans
  const prose = (text: string, cites: string[], where: string) => {
    const bodies = cites.flatMap((c) => d.texts.get(c.split('@')[0]) ?? [])
    for (const [, q] of text.matchAll(/“([^“”]+)”/g))
      if ([...q].length >= 8 && !bodies.some((b) => !quoteMisses(b, q).length)) errors.push(`${where}: quoted passage not found in its cites: "${q.slice(0, 50)}"`)
  }
  const voiced = (vs: { cite: string; text: string; quote?: boolean }[], where: string) =>
    vs.forEach((v, i) => {
      cite(v.cite, `${where} voice ${i}`)
      if (v.quote) quote(v.cite, v.text, `${where} voice ${i}`)
    })

  for (const p of d.people) {
    const w = `person ${p.id}`
    p.cites.forEach((c) => cite(c, w))
    for (const x of p.positions) if (x.cite) cite(x.cite, `${w} position ${x.title}`)
    for (const x of p.life) {
      x.cites.forEach((c) => cite(c, `${w} life ${x.h}`))
      prose(x.text, x.cites, `${w} life ${x.h}`)
    }
    for (const x of p.family) {
      x.cites.forEach((c) => cite(c, `${w} family ${x.name}`))
      prose(x.text, x.cites, `${w} family ${x.name}`)
    }
    prose(p.bio, p.cites, `${w} bio`)
    for (const x of p.fall) cite(x.cite, `${w} fall ${x.date}`)
    voiced(p.assess, w)
    for (const t of p.factions) {
      ref(factions, 'faction', t.f, w)
      const s = cite(t.cite, `${w} faction ${t.f}`)
      if (s && !FACTION_VOICES.includes(s.voice)) errors.push(`${w} faction ${t.f}: source ${s.id} is voice "${s.voice}", not allowed for faction labels`)
      if (t.quote) quote(t.cite, t.quote, `${w} faction ${t.f}`)
      else warnings.push(`${w} faction ${t.f}: no supporting sentence`)
    }
    if (p.tier === 1 && p.life.length === 0) errors.push(`${w}: tier 1 needs a biography (life)`)
  }
  for (const [id, list] of d.quotes) {
    ref(people, 'person', id, 'quotes')
    if (!people.has(id)) continue
    list.forEach((q, i) => {
      cite(q.cite, `quote ${id} #${i}`)
      quote(q.cite, q.text, `quote ${id} #${i}`)
    })
  }
  for (const f of d.factions) {
    f.core.forEach((id) => ref(people, 'person', id, `faction ${f.id} core`))
    f.cites.forEach((c) => cite(c, `faction ${f.id}`))
    prose(f.summary, f.cites, `faction ${f.id}`)
    voiced(f.voices, `faction ${f.id}`)
  }
  for (const e of d.events) {
    const w = `event ${e.id}`
    e.people.forEach((id) => ref(people, 'person', id, w))
    e.factions.forEach((id) => ref(factions, 'faction', id, w))
    e.concepts.forEach((id) => ref(concepts, 'concept', id, w))
    e.cites.forEach((c) => cite(c, w))
    prose(e.summary, e.cites, w)
    voiced(e.voices, w)
  }
  for (const c of d.concepts) {
    const w = `concept ${c.id}`
    if (c.parent) ref(concepts, 'concept', c.parent, w)
    c.by.forEach((id) => ref(people, 'person', id, w))
    c.related.forEach((id) => ref(concepts, 'concept', id, w))
    c.cites.forEach((x) => cite(x, w))
    prose(c.summary, c.cites, w)
    if (c.first) {
      cite(c.first.cite, `${w} first`)
      if (c.first.quote) quote(c.first.cite, c.first.quote, `${w} first`)
    }
    for (const k of c.codified) {
      cite(k.cite, `${w} codified`)
      if (k.quote) quote(k.cite, k.quote, `${w} codified`)
    }
    if (c.quote) {
      cite(c.quote.cite, `${w} quote`)
      quote(c.quote.cite, c.quote.text, `${w} quote`)
    }
    voiced(c.voices, w)
  }
  for (const g of d.congresses) {
    const w = `congress ${g.n}`
    for (const id of [g.gs, ...g.psc, ...g.pb, ...g.alt, ...g.sec, ...g.cmc.map((x) => x.id), ...g.changes.map((x) => x.person)]) ref(people, 'person', id, w)
    g.cites.forEach((c) => cite(c, w))
    for (const x of g.changes) cite(x.cite, `${w} change ${x.person}`)
  }
  for (const c of d.corpus) {
    const s = cite(c.id, `corpus ${c.id}`)
    if (s?.excerpt) errors.push(`corpus ${c.id}: an excerpt cannot be counted`)
  }
}

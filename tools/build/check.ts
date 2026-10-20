// Stage 2: unique ids, references between records, cited sources, verbatim quotes.
import { FACTION_VOICES } from '../../src/data/schema.ts'
import { quoteMisses } from '../../src/lib/quotes.ts'
import { BATCH, errors, inflightSource, warnings } from './io.ts'
import type { Data } from './load.ts'

// people who held office; their cases cannot be read as 政治打压 or 迫害 (decisions #70)
const OFFICIAL_ROLES = new Set(['tiger', 'psc', 'pb', 'cc', 'cmc', 'general', 'minister', 'prov', 'ccdi', 'sec'])

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
  const events = unique('event', d.events.map((e) => e.id))
  // batches running in parallel cannot see each other's manifests, so they may register the same page twice;
  // a batch re-registering a page that is already integrated should cite the existing id instead
  const own = BATCH ? `${BATCH.toLowerCase()}-` : undefined
  const byUrl = new Map<string, string[]>()
  for (const s of d.sources) if (!s.id.startsWith('wd-')) byUrl.set(s.url, [...(byUrl.get(s.url) ?? []), s.id])
  for (const [url, ids] of byUrl) {
    if (ids.length < 2) continue
    // two batches of the same round may register a page at the same time; only integrated ones count
    const earlier = ids.filter((id) => !own || (!id.startsWith(own) && !inflightSource(id)))
    if (own && earlier.length && earlier.length < ids.length) errors.push(`${ids.filter((id) => id.startsWith(own)).join(', ')}: already registered as ${earlier[0]}, cite that (${url})`)
    else warnings.push(`one page, several sources: ${ids.join(', ')} (${url})`)
  }

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
  const tags = (list: { f: string; cite: string; quote?: string; rankQuote?: string }[], w: string) => {
    for (const t of list) {
      ref(factions, 'faction', t.f, w)
      const s = cite(t.cite, `${w} faction ${t.f}`)
      if (s && !FACTION_VOICES.includes(s.voice)) errors.push(`${w} faction ${t.f}: source ${s.id} is voice "${s.voice}", not allowed for faction labels`)
      if (t.quote) quote(t.cite, t.quote, `${w} faction ${t.f}`)
      else warnings.push(`${w} faction ${t.f}: no supporting sentence`)
      if (t.rankQuote) quote(t.cite, t.rankQuote, `${w} faction ${t.f} rank`)
    }
  }
  // a status, a fall or a change of seat rests on reliable sources only (decisions #27)
  const reliable = (c: string, where: string) => {
    if (d.sourceById.get(c.split('@')[0])?.rumor) errors.push(`${where}: ${c} is a rumor source and cannot set a status or a fall`)
  }

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
    for (const x of p.fall) {
      cite(x.cite, `${w} fall ${x.date}`)
      reliable(x.cite, `${w} fall ${x.date}`)
    }
    if (p.cites.every((c) => d.sourceById.get(c.split('@')[0])?.rumor)) errors.push(`${w}: needs at least one reliable source in cites`)
    voiced(p.assess, w)
    tags(p.factions, w)
    if (p.tier === 1 && p.life.length === 0) errors.push(`${w}: tier 1 needs a biography (life)`)
  }
  // tags and quotes for people whose entry is not written yet are still checked against their sources
  for (const [id, list] of d.pendingTags) tags(list, `tags ${id}`)
  for (const [id, list] of d.pendingAssess) {
    if (planned.has(id)) warnings.push(`assessments for ${id} wait for the entry`)
    else errors.push(`content/assess: no person ${id}`)
    voiced(list, `assess ${id}`)
  }
  for (const [id, list] of d.quotes) {
    ref(people, 'person', id, 'quotes')
    list.forEach((q, i) => {
      cite(q.cite, `quote ${id} #${i}`)
      quote(q.cite, q.text, `quote ${id} #${i}`)
    })
  }
  for (const f of d.factions) {
    f.core.forEach((id) => ref(people, 'person', id, `faction ${f.id} core`))
    if (f.patron) ref(people, 'person', f.patron, `faction ${f.id} patron`)
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
    if (c.id === 'chain') errors.push(`${w}: #/ideas/chain is the idea-to-policy map, pick another id`)
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
    for (const s of c.sections) {
      s.cites.forEach((x) => cite(x, `${w} ${s.h}`))
      prose(s.text, s.cites, `${w} ${s.h}`)
    }
    for (const l of c.lists) {
      cite(l.cite, `${w} ${l.title}`)
      l.items.forEach((t, i) => quote(l.cite, t, `${w} ${l.title} #${i + 1}`))
    }
    for (const s of c.sides) {
      s.cites.forEach((x) => cite(x, `${w} side ${s.label}`))
      s.who.forEach((id) => ref(people, 'person', id, `${w} side ${s.label}`))
      prose(s.text, s.cites, `${w} side ${s.label}`)
    }
    for (const x of c.policies) {
      cite(x.cite, `${w} policy ${x.name}`)
      x.events.forEach((id) => ref(events, 'event', id, `${w} policy ${x.name}`))
      prose(x.text, [x.cite], `${w} policy ${x.name}`)
    }
  }
  for (const g of d.congresses) {
    const w = `congress ${g.n}`
    for (const id of [g.gs, ...g.psc, ...g.pb, ...g.alt, ...g.sec, ...g.cmc.map((x) => x.id), ...g.changes.map((x) => x.person)]) ref(people, 'person', id, w)
    g.cites.forEach((c) => cite(c, w))
    for (const [name, id] of Object.entries(g.names)) {
      ref(people, 'person', id, `${w} name ${name}`)
      if (!g.cc.includes(name) && !g.cca.includes(name)) errors.push(`${w} name ${name}: not on the cc or cca list`)
    }
    for (const x of g.changes) {
      cite(x.cite, `${w} change ${x.person}`)
      reliable(x.cite, `${w} change ${x.person}`)
    }
  }
  const seenRel = new Set<string>()
  for (const r of d.relations) {
    const w = `relation ${r.a}–${r.b} ${r.kind}`
    ref(people, 'person', r.a, w)
    ref(people, 'person', r.b, w)
    if (r.a === r.b) errors.push(`${w}: a person cannot be related to themself`)
    const key = [r.kind, ...(r.kind === 'colleague' || r.kind === 'kin' || r.kind === 'rival' ? [r.a, r.b].sort() : [r.a, r.b])].join(' ')
    if (seenRel.has(key)) warnings.push(`${w}: entered twice`)
    seenRel.add(key)
    cite(r.cite, w)
    if (r.quote) quote(r.cite, r.quote, w)
  }
  for (const c of d.corpus) {
    const s = cite(c.id, `corpus ${c.id}`)
    if (s?.excerpt) errors.push(`corpus ${c.id}: an excerpt cannot be counted`)
  }
  const isms = unique('ism', d.isms.map((m) => m.id))
  for (const m of d.isms) {
    const w = `ism ${m.id}`
    for (const id of [...m.parents, ...m.against]) {
      if (!isms.has(id)) errors.push(`${w}: unknown ism "${id}"`)
      if (id === m.id) errors.push(`${w}: cannot descend from or oppose itself`)
    }
    m.carriers.forEach((id) => ref(people, 'person', id, w))
    if (m.concept) ref(concepts, 'concept', m.concept, w)
    if (m.to && m.to < m.from) errors.push(`${w}: ends before it begins`)
    if (m.pos.some((p, i) => i && p.at < m.pos[i - 1].at)) errors.push(`${w}: positions out of date order`)
    m.cites.forEach((c) => cite(c, w))
    prose(m.summary, m.cites, w)
    voiced(m.voices, w)
  }
  for (const p of d.line) cite(p.cite, `line ${p.at} ${p.label}`)
  unique('press term', d.press.map((t) => t.id))
  for (const t of d.press) {
    const w = `press ${t.id}`
    if (t.concept) ref(concepts, 'concept', t.concept, w)
    if (t.ism && !isms.has(t.ism)) errors.push(`${w}: unknown ism "${t.ism}"`)
    if (t.hits.length && !t.cite) errors.push(`${w}: yearly hits need a cite naming the archive searched`)
    if (t.cite) cite(t.cite, w)
    if (new Set(t.hits.map((h) => h.year)).size !== t.hits.length) errors.push(`${w}: a year is entered twice`)
  }
  // provincial chiefs: linked people exist and carry the same name; one post has one holder at a time
  const byPost = new Map<string, typeof d.chiefs>()
  for (const c of d.chiefs) {
    const w = `chief ${c.prov} ${c.post} ${c.name} ${c.from}`
    cite(c.cite, w)
    if (c.person) {
      ref(people, 'person', c.person, w)
      const p = d.people.find((x) => x.id === c.person)
      if (p && p.name !== c.name) errors.push(`${w}: person ${c.person} is named ${p.name}`)
    }
    if (c.to && c.to < c.from) errors.push(`${w}: ends before it starts`)
    byPost.set(`${c.prov} ${c.post}`, [...(byPost.get(`${c.prov} ${c.post}`) ?? []), c])
  }
  const month = (s: string) => Number(s.slice(0, 4)) * 12 + (s.length > 4 ? Number(s.slice(5, 7)) - 1 : 6)
  for (const [k, list] of byPost) {
    const s = [...list].sort((x, y) => x.from.localeCompare(y.from))
    for (let i = 1; i < s.length; i++) {
      const end = s[i - 1].to
      if (!end) errors.push(`chief ${k}: ${s[i - 1].name} has no end but ${s[i].name} follows`)
      else if (month(end) - month(s[i].from) > 2) errors.push(`chief ${k}: ${s[i - 1].name} (to ${end}) overlaps ${s[i].name} (from ${s[i].from})`)
      else if (month(s[i].from) - month(end) > 3 && s[i].from > '2000') warnings.push(`chief ${k}: gap ${end} – ${s[i].from}`)
    }
  }
  const editor = (x: { text: string; cites: string[] }, where: string) => {
    x.cites.forEach((c) => cite(c, where))
    prose(x.text, x.cites, where)
  }
  for (const [id, c] of d.falls) {
    const w = `${c.file} ${id}`
    ref(people, 'person', id, w)
    const p = d.people.find((x) => x.id === id)
    if (p && !p.fall.length && p.status !== 'missing') warnings.push(`${w}: a fall case for someone with no fall record`)
    for (const x of c.fall) {
      cite(x.cite, `${w} fall ${x.date}`)
      reliable(x.cite, `${w} fall ${x.date}`)
    }
    if (c.status && !c.fall.length) errors.push(`${w}: a status change needs the fall step that makes it`)
    if (c.notice) {
      cite(c.notice.cite, `${w} notice`)
      reliable(c.notice.cite, `${w} notice`)
      for (const q of c.notice.quotes) quote(c.notice.cite, q, `${w} notice`)
    }
    if (c.amount) {
      cite(c.amount.cite, `${w} amount`)
      reliable(c.amount.cite, `${w} amount`)
    }
    if (c.sentence) {
      cite(c.sentence.cite, `${w} sentence`)
      reliable(c.sentence.cite, `${w} sentence`)
      if (c.sentence.term === 'years' && !c.sentence.years) errors.push(`${w} sentence: a fixed term needs years`)
    }
    for (const x of c.plea) {
      cite(x.cite, `${w} plea ${x.kind}`)
      reliable(x.cite, `${w} plea ${x.kind}`)
    }
    if (c.trigger) cite(c.trigger.cite, `${w} trigger`)
    if (p?.roles.some((r) => OFFICIAL_ROLES.has(r)) && (c.politics?.level === 'repression' || c.trigger?.kind === 'persecution'))
      errors.push(`${w}: 政治打压 and 迫害 are for people outside the system, not fallen officials`)
    for (const x of c.with) {
      if (x.id) ref(people, 'person', x.id, `${w} with ${x.name}`)
      if (x.id === id) errors.push(`${w}: falls with themself`)
      cite(x.cite, `${w} with ${x.name}`)
    }
    if (c.politics) editor({ text: c.politics.why, cites: c.politics.cites }, `${w} politics`)
    voiced(c.voices, w)
  }
  for (const [id, t] of d.turns) {
    const w = `${t.file} ${id}`
    ref(people, 'person', id, w)
    for (const r of t.rungs) cite(r.cite, `${w} rung ${r.rung}`)
    if (t.rungs.some((r, i) => i && r.date < t.rungs[i - 1].date)) errors.push(`${w}: rungs out of date order`)
    for (const x of t.turns) {
      x.who.forEach((p) => ref(people, 'person', p, `${w} turn ${x.h}`))
      x.cites.forEach((c) => cite(c, `${w} turn ${x.h}`))
      prose(`${x.text}${x.did}`, x.cites, `${w} turn ${x.h}`)
    }
    editor(t.can, `${w} can`)
    editor(t.cannot, `${w} cannot`)
    for (const x of t.counter) {
      if (x.id) ref(people, 'person', x.id, `${w} counter ${x.name}`)
      cite(x.cite, `${w} counter ${x.name}`)
      prose(x.text, [x.cite], `${w} counter ${x.name}`)
    }
  }
  unique('case', d.cases.map((c) => c.id))
  for (const c of d.cases) {
    const w = `case ${c.id}`
    if (c.lead) ref(people, 'person', c.lead, w)
    c.people.forEach((id) => ref(people, 'person', id, w))
    c.events.forEach((id) => ref(events, 'event', id, w))
    c.factions.forEach((id) => ref(factions, 'faction', id, w))
    c.cites.forEach((x) => cite(x, w))
    prose(c.summary, c.cites, w)
    for (const s of c.sections) {
      s.cites.forEach((x) => cite(x, `${w} ${s.h}`))
      prose(s.text, s.cites, `${w} ${s.h}`)
    }
    voiced(c.voices, w)
    c.editor.forEach((x, i) => editor(x, `${w} editor ${i}`))
  }
  unique('chapter', d.story.map((c) => c.id))
  const congresses = new Set(d.congresses.map((c) => c.n))
  for (const c of d.story)
    c.steps.forEach((s, i) => {
      const w = `story ${c.id} step ${i}`
      for (const id of s.events) ref(events, 'event', id, w)
      const st = s.stage
      prose(s.text, [...d.events.filter((e) => s.events.includes(e.id)).flatMap((e) => e.cites), ...(st.kind === 'doc' ? [st.cite] : [])], w)
      for (const id of [...s.people, ...(st.kind === 'seats' || st.kind === 'falls' ? st.focus : [])]) ref(people, 'person', id, w)
      for (const n of st.kind === 'seats' ? [st.n] : st.kind === 'cmc' ? st.n : []) if (!congresses.has(n)) errors.push(`${w}: no congress ${n}`)
      if (st.kind === 'doc') {
        cite(st.cite, w)
        quote(st.cite, st.text, w)
        if (st.strike && !st.text.includes(st.strike)) errors.push(`${w}: strike "${st.strike}" is not in the text`)
      }
    })
}

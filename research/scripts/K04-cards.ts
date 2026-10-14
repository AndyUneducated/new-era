// K04: write content/people/K04.yaml, research/roster/K04.yaml and research/manifests/K04.yaml from the
// mechanical fields (.probe/K04-auto.json, from K04-brief.ts) and the hand-written cards (K04-data.ts) and
// sources (K04-sources.ts). Prints the field conflicts it notices to .probe/K04-cards.txt.
//   node research/scripts/K04-cards.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { D } from './K04-data.ts'
import { SOURCES } from './K04-sources.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Auto = {
  name: string; id: string; qid?: string; wd: boolean; wdBorn?: string; wdDied?: string; wdBp?: string; born?: string; birthplace?: string
  female: boolean; eth?: string; seats: { term: number; cc: boolean }[]; url?: string; pageTitle?: string; leadStart: string; end?: string
}
const auto = JSON.parse(readFileSync(join(ROOT, '.probe', 'K04-auto.json'), 'utf8')) as Record<string, Auto>
const taken = new Set(readFileSync(join(ROOT, '.probe', 'K04-taken.txt'), 'utf8').split('# ids')[1].split(/\s+/).filter(Boolean))
const q = (s: string) => (/^[\p{Script=Han}\w·（）、，。；（）—\- ]+$/u.test(s) && !/^[-\d]/.test(s) && !/[:#]/.test(s) ? s : JSON.stringify(s))
const SYS: Record<string, string> = { p: 'party', g: 'gov', a: 'army', o: 'other' }
const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const cn = (n: number) => (n < 20 ? '十' + NUM[n - 10] : NUM[Math.floor(n / 10)] + '十' + NUM[n % 10])
const LIST: Record<string, string> = {
  '17cc': 'k02-xinhua-2007-10-21-17-cc', '17cca': 'k02-xinhua-2007-10-21-17-cca', '18cc': 'k02-xinhua-2012-11-14-18-cc', '18cca': 'k02-xinhua-2012-11-14-18-cca',
  '19cc': 'k02-xinhua-2017-10-24-19-cc', '19cca': 'k02-xinhua-2017-10-24-19-cca', '20cc': 'k02-xinhua-2022-10-22-20-cc', '20cca': 'k02-xinhua-2022-10-22-20-cca',
}

// Wikipedia articles another batch already registered: cite theirs
const wikiOf = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'research', 'manifests'))) {
  if (f === 'K04.yaml') continue
  for (const m of readFileSync(join(ROOT, 'research', 'manifests', f), 'utf8').matchAll(/id: ([a-z0-9-]+),[^\n]*?url: "?https:\/\/zh\.wikipedia\.org\/(?:wiki|zh-hans|zh-cn|zh-hant)\/([^",\s}]+)/g)) {
    let t = m[2]
    try { t = decodeURIComponent(t) } catch { /* keep raw */ }
    wikiOf.set(t.replace(/_/g, ' '), m[1])
  }
}

const notes: string[] = []
const cards: string[] = []
const roster: string[] = []
const wikiSrc: string[] = []
const ids = new Set<string>()
for (const [key, c] of Object.entries(D)) {
  const a = auto[key]
  if (!a) { notes.push(`NO AUTO ${key}`); continue }
  const id = c.id ?? a.id
  if (!/^[a-z0-9-]+$/.test(id) || taken.has(id) || ids.has(id)) notes.push(`ID CLASH ${key} ${id}`)
  ids.add(id)
  const born = c.born ?? a.born ?? a.wdBorn
  if (a.born && a.wdBorn && a.born.slice(0, 4) !== a.wdBorn.slice(0, 4)) notes.push(`BORN ${key}: wiki ${a.born} / wd ${a.wdBorn} -> ${born}`)
  if (c.born && a.born && c.born !== a.born) notes.push(`BORN override ${key}: wiki ${a.born} -> ${c.born}`)
  const bp = c.bp ?? a.birthplace
  if (!bp) notes.push(`NO BIRTHPLACE ${key} (wd ${a.wdBp})`)
  if (a.wdDied && !c.died) notes.push(`WD DIED ${key}: ${a.wdDied}${c.noWd ? ' (wikidata id dropped)' : ''}`)
  const seats = c.seats ? c.seats.map(([term, cc]) => ({ term, cc })) : a.seats
  const cc = seats.filter((s) => s.cc).map((s) => s.term)
  const cca = seats.filter((s) => !s.cc).map((s) => s.term)
  const seatText = [
    cca.length ? `${cca.map(cn).join('、')}届中央候补委员` : '',
    cc.length ? `${cc.map(cn).join('、')}届中央委员` : '',
  ].filter(Boolean).join('、')
  const wdOk = a.wd && a.qid && !c.noWd
  const page = c.page ?? a.pageTitle
  const wiki = (page && wikiOf.get(page)) || `k04-wiki-${id}`
  if (wiki === `k04-wiki-${id}`) {
    const url = `https://zh.wikipedia.org/zh-cn/${(page ?? a.name).replace(/ /g, '_')}`
    const extra = a.leadStart && !c.page ? `, start: ${JSON.stringify(a.leadStart)}${a.end ? `, end: ${JSON.stringify(a.end)}` : ''}` : ''
    wikiSrc.push(`  - { id: ${wiki}, title: ${q(`${a.name}（维基百科）`)}, publisher: 维基百科, voice: wiki, url: ${JSON.stringify(url)}${extra}, excerpt: true, keep: [ 年 ] }`)
  }
  const roles = [cc.length ? 'cc' : 'acc', ...(c.r ?? [])]
  const fall = (c.f ?? []).map(([date, text, cite]) => `    - { date: ${date}, text: ${q(text)}, cite: ${cite} }`)
  const pos = c.p.map((s) => {
    const [title, sys, place, from, to] = s.split('|')
    return `    - { title: ${q(title)}, sys: ${SYS[sys]}${place ? `, place: ${place}` : ''}${from ? `, from: ${from}` : ''}${to ? `, to: ${to}` : ''}, cite: ${wiki} }`
  })
  const cites = [...new Set([
    ...(wdOk ? [`wd-${a.qid}`] : []), wiki,
    ...seats.map((s) => LIST[`${s.term}${s.cc ? 'cc' : 'cca'}`]).filter(Boolean),
    ...(c.f ?? []).map((x) => x[2]), ...(c.dc ? [c.dc] : []), ...(c.c ?? []),
  ])]
  const lead = `${bp ? `${bp}人，` : ''}${a.eth ? `${a.eth}，` : ''}${seatText}。`
  cards.push([
    `- id: ${id}`,
    `  name: ${a.name}`,
    `  gender: ${a.female ? 'f' : 'm'}`,
    ...(a.eth ? [`  ethnicity: ${a.eth}`] : []),
    ...(born ? [`  born: ${born}`] : []),
    ...(c.died ? [`  died: ${c.died}`] : []),
    ...(bp ? [`  birthplace: ${bp}`] : []),
    `  roles: [${roles.join(', ')}]`,
    `  status: ${c.s ?? 'retired'}`,
    ...(c.sn ? [`  statusNote: ${q(c.sn)}`] : []),
    ...(fall.length ? ['  fall:', ...fall] : []),
    '  tier: 2',
    `  headline: ${q(c.h)}`,
    ...(wdOk ? [`  ids: { wikidata: ${a.qid} }`] : []),
    '  bio: >-',
    `    ${lead}${c.b}`,
    ...(pos.length ? ['  positions:', ...pos] : []),
    `  cites: [${cites.join(', ')}]`,
    '',
  ].join('\n'))
  roster.push(`- { id: ${id}, name: ${a.name}, batch: K04, tier: 2 }`)
}

const head = '# K04 dossier cards (tier 2): people first on the 17th or 18th Central Committee lists, full or alternate\n# generated by research/scripts/K04-cards.ts; hand-written parts live in research/scripts/K04-data.ts\n\n'
writeFileSync(join(ROOT, 'content', 'people', 'K04.yaml'), head + cards.join('\n'))
writeFileSync(join(ROOT, 'research', 'roster', 'K04.yaml'), '# K04: people first on the 17th or 18th Central Committee lists\n\n' + roster.join('\n') + '\n')
const src = SOURCES.map((s) => [
  `  - id: ${s.id}`, `    title: ${q(s.title)}`, `    publisher: ${s.publisher}`, `    date: ${s.date}`, `    voice: ${s.voice}`, `    url: ${JSON.stringify(s.url)}`,
  ...(s.start ? [`    start: ${JSON.stringify(s.start)}`] : []), ...(s.end ? [`    end: ${JSON.stringify(s.end)}`] : []),
].join('\n'))
writeFileSync(join(ROOT, 'research', 'manifests', 'K04.yaml'), [
  '# K04: dossier cards for people first on the 17th or 18th Central Committee lists (full or alternate).',
  '# generated by research/scripts/K04-cards.ts from K04-sources.ts and the picked zh.wikipedia articles',
  'web:',
  '  # --- falls (CCDI notices, verdicts) and deaths (obituaries) ---',
  ...src,
  '  # --- the zh.wikipedia article of each person (basic facts only) ---',
  ...wikiSrc,
  '',
].join('\n'))
writeFileSync(join(ROOT, '.probe', 'K04-cards.txt'), notes.join('\n') + '\n')
console.log(`${cards.length} cards, ${wikiSrc.length} wiki sources, ${notes.length} notes`)

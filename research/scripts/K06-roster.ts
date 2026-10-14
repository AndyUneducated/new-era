// K06 roster: people whose first Central Committee list (full or alternate) is the 20th, minus those with an entry.
//   node research/scripts/K06-roster.ts   -> .probe/K06-roster.json, .probe/K06-roster.txt
// Names in K01.yaml may carry a disambiguating note in （）; a 20th name whose bare form appears on an earlier
// list, or matches an existing entry, is flagged for a manual same-person check rather than silently dropped.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8')
const bare = (s: string) => s.replace(/（[^）]*）/g, '').trim()

type Congress = { n: number; cc?: string[]; cca?: string[] }
const congresses = parse(read('content', 'congresses', 'K01.yaml')) as Congress[]
const earlier = new Map<string, string[]>() // bare name -> ["16cc 王国生（军队）", ...]
for (const c of congresses.filter((c) => c.n >= 16 && c.n <= 19))
  for (const k of ['cc', 'cca'] as const)
    for (const name of c[k] ?? []) earlier.set(bare(name), [...(earlier.get(bare(name)) ?? []), `${c.n}${k} ${name}`])

// gender and ethnicity from the published lists
const notes = new Map<string, string>()
for (const id of ['k02-xinhua-2022-10-22-20-cc', 'k02-xinhua-2022-10-22-20-cca'])
  for (const m of read('sources', 'text', `${id}.txt`).matchAll(/(\S+?)（([^）]*)）/g)) notes.set(`${id.endsWith('cca') ? 'cca' : 'cc'}:${m[1]}`, m[2])

type P = { id: string; name: string; aka?: string[]; born?: string | number; headline?: string }
const existing = new Map<string, string[]>()
for (const f of readdirSync(join(ROOT, 'content', 'people')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K06'))) {
  let list: P[] = []
  try {
    list = parse(read('content', 'people', f)) ?? []
  } catch {
    console.error(`skip ${f}`)
    continue
  }
  for (const p of list)
    for (const n of [p.name, ...(p.aka ?? [])]) existing.set(bare(n), [...(existing.get(bare(n)) ?? []), `${f}:${p.id} ${p.born ?? ''} ${p.headline ?? ''}`])
}
const planned = new Map<string, string[]>()
const rosterFiles = ['roster.yaml', ...readdirSync(join(ROOT, 'research', 'roster')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K06')).map((f) => `roster/${f}`)]
for (const f of rosterFiles) {
  let list: { id: string; name: string; batch: string }[] = []
  try {
    list = parse(read('research', ...f.split('/'))) ?? []
  } catch {
    continue
  }
  for (const r of list) planned.set(bare(r.name), [...(planned.get(bare(r.name)) ?? []), `${r.batch}:${r.id}`])
}

// checked by hand: the earlier namesake is someone else, so the 20th-list person is new
const NAMESAKES: Record<string, string> = {
  刘伟: '17cca 刘伟 is not the 1965-born transport minister, who was a vice-minister of finance in 2016',
  李伟: '18cc 李伟 is the 1953-born head of the State Council Development Research Center; the 20th is the 1960-born general',
  王健: '18cca 王健 is not the 1965-born Liaoning executive vice-governor',
}
for (const n of Object.keys(NAMESAKES)) earlier.delete(n)

const c20 = congresses.find((c) => c.n === 20)!
const rows: { name: string; list: 'cc' | 'cca'; note?: string; earlier?: string[]; existing?: string[]; planned?: string[]; mine: boolean }[] = []
for (const k of ['cc', 'cca'] as const)
  for (const name of c20[k] ?? []) {
    const b = bare(name)
    const row = { name, list: k, note: notes.get(`${k}:${b}`), earlier: earlier.get(b), existing: existing.get(b), planned: planned.get(b), mine: false }
    row.mine = !row.earlier && !row.existing
    rows.push(row)
  }

const mine = rows.filter((r) => r.mine)
const check = rows.filter((r) => (r.earlier && r.earlier.every((e) => bare(e.split(' ')[1]) === bare(r.name)) && r.earlier.some((e) => e.split(' ')[1] !== r.name)) || (!r.earlier && r.existing))
const out = [
  `20th cc+cca: ${rows.length}; first on 20th: ${rows.filter((r) => !r.earlier).length}; of those with an entry already: ${rows.filter((r) => !r.earlier && r.existing).length}; K06 to build: ${mine.length}`,
  '',
  '## to build',
  ...mine.map((r) => `${r.list}\t${r.name}${r.note ? `（${r.note}）` : ''}${r.planned ? `\tplanned ${r.planned.join(',')}` : ''}`),
  '',
  '## first on 20th, entry exists (check same person)',
  ...rows.filter((r) => !r.earlier && r.existing).map((r) => `${r.list}\t${r.name}\t${r.existing!.join(' | ')}`),
  '',
  '## bare name on an earlier list (check same person)',
  ...rows.filter((r) => r.earlier).map((r) => `${r.list}\t${r.name}\t${r.earlier!.join(', ')}${r.existing ? `\tentry ${r.existing.join(' | ')}` : ''}`),
]
writeFileSync(join(ROOT, '.probe', 'K06-roster.txt'), out.join('\n') + '\n')
writeFileSync(join(ROOT, '.probe', 'K06-roster.json'), JSON.stringify({ mine, check: check.map((r) => r.name) }, null, 1))
console.log(out[0])

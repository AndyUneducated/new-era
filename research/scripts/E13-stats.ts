// Counts events per year and per lane, and dumps events, policies, people, concepts and factions so E13 can
// check for duplicates, pick ids and see which lanes of the thin years (2000, 2001, 2002, 2013) are empty.
//   node research/scripts/E13-stats.ts [--with-e13]
//   -> .probe/E13-stats.txt, .probe/E13-events.txt, .probe/E13-policies.txt, .probe/E13-people.txt, .probe/E13-ids.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const withOwn = process.argv.includes('--with-e13')
const yamls = (d: string) => readdirSync(join(ROOT, 'content', d)).filter((f) => f.endsWith('.yaml') && (withOwn || f !== 'E13.yaml'))
const load = (d: string, f: string) => parse(readFileSync(join(ROOT, 'content', d, f), 'utf8')) ?? []
const LANES = ['prelude', 'power', 'purge', 'army', 'ideo', 'econ', 'society', 'ethnic', 'hkmt', 'foreign', 'folk']
const THIN = ['2000', '2001', '2002', '2013']

type Ev = { id: string; date: string; end?: string; title: string; lane: string; people?: string[]; concepts?: string[] }
const ev: string[] = []
const count = new Map<string, Map<string, number>>()
const thin = new Map<string, string[]>()
for (const f of yamls('events'))
  for (const e of load('events', f) as Ev[]) {
    const y = String(e.date).slice(0, 4)
    ev.push(`${String(e.date)}\t${e.end ?? ''}\t${e.id}\t${e.lane}\t${e.title}\t${(e.people ?? []).join(',')}\t${(e.concepts ?? []).join(',')}\t${f}`)
    const m = count.get(y) ?? new Map<string, number>()
    m.set(e.lane, (m.get(e.lane) ?? 0) + 1)
    count.set(y, m)
    if (THIN.includes(y)) thin.set(y, [...(thin.get(y) ?? []), `  ${String(e.date)}\t${e.lane}\t${e.title}\t${e.id}`])
  }
ev.sort()
writeFileSync(join(ROOT, '.probe', 'E13-events.txt'), ev.join('\n') + '\n')

const out: string[] = ['year\ttotal\t' + LANES.join('\t')]
for (const y of [...count.keys()].sort()) {
  const m = count.get(y)!
  out.push(`${y}\t${[...m.values()].reduce((a, b) => a + b, 0)}\t${LANES.map((l) => m.get(l) ?? 0).join('\t')}`)
}
out.push('')
for (const y of THIN) out.push(y, ...(thin.get(y) ?? []).sort(), '')
writeFileSync(join(ROOT, '.probe', 'E13-stats.txt'), out.join('\n') + '\n')

type Pol = { date: string; name: string; events?: string[] }
const pol: string[] = []
const dump = (file: string, id: string, ps: Pol[] | undefined) => {
  for (const p of ps ?? []) pol.push(`${(p.events ?? []).length ? 'HAS' : 'EMPTY'}\t${file}\t${id}\t${String(p.date)}\t${p.name}\t${(p.events ?? []).join(',')}`)
}
const ids: string[] = []
for (const f of yamls('concepts'))
  for (const c of load('concepts', f) as { id: string; name: string; policies?: Pol[] }[]) {
    dump(f, c.id, c.policies)
    ids.push(`concept\t${c.id}\t${c.name}\t${f}`)
  }
for (const f of yamls('concept-more'))
  for (const [id, m] of Object.entries(load('concept-more', f) as Record<string, { policies?: Pol[] }>)) dump('more/' + f, id, m.policies)
writeFileSync(join(ROOT, '.probe', 'E13-policies.txt'), pol.join('\n') + '\n')
for (const f of yamls('factions')) for (const x of load('factions', f) as { id: string; name: string }[]) ids.push(`faction\t${x.id}\t${x.name}\t${f}`)
writeFileSync(join(ROOT, '.probe', 'E13-ids.txt'), ids.join('\n') + '\n')

const ppl: string[] = []
for (const f of yamls('people'))
  for (const p of load('people', f) as { id: string; name: string; status: string }[]) ppl.push(`${p.id}\t${p.name}\t${p.status}\t${f}`)
writeFileSync(join(ROOT, '.probe', 'E13-people.txt'), ppl.join('\n') + '\n')
console.log(ev.length, pol.length, ppl.length, ids.length)

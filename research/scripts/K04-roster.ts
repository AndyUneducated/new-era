// K04 roster: people whose first Central Committee list (full or alternate) is the 17th or the 18th,
// less those who already have an entry in content/people. Writes .probe/K04-roster.json and .txt.
//   node research/scripts/K04-roster.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Congress = { n: number; cc?: string[]; cca?: string[] }
const congresses = parse(readFileSync(join(ROOT, 'content', 'congresses', 'K01.yaml'), 'utf8')) as Congress[]

// the lists keep notes for namesakes (王国生（军队）) and sometimes ethnicity; the bare name is the key
const bare = (s: string) => s.replace(/（[^）]*）$/, '').trim()

// list entries that name the same person under another key, resolved by hand from the careers:
// the 18th/19th 王国生 is the 17th-term alternate from Jiangsu; the 18th alternate 王宁 is the army officer
// later PAP commander; the 20th 王宁 is the Fujian/Yunnan one; 李斌（国家机关） is the 17th/18th 李斌
const SAME: Record<string, string> = {
  '18:王国生': '王国生（江苏）',
  '19:王国生': '王国生（江苏）',
  '18:王宁': '王宁（武警）',
  '20:王宁': '王宁（福建）',
  '19:李斌（国家机关）': '李斌',
}
// entries whose name matches but who are someone else: 王军 (wang-jun-citic, b. 1941) is not the tax chief 王军
const NOT_THEM: Record<string, string[]> = { 王军: ['wang-jun-citic'] }

type Seat = { n: number; list: 'cc' | 'cca'; raw: string }
const seats = new Map<string, Seat[]>()
for (const c of congresses)
  for (const list of ['cc', 'cca'] as const)
    for (const raw of c[list] ?? []) {
      const key = SAME[`${c.n}:${raw}`] ?? raw
      if (key !== raw) console.log(`${c.n}:${raw} -> ${key}`)
      seats.set(key, [...(seats.get(key) ?? []), { n: c.n, list, raw }])
    }

// existing entries, by name and by bare name
const existing = new Map<string, { id: string; file: string; headline?: string; born?: string }[]>()
for (const f of readdirSync(join(ROOT, 'content', 'people')).filter((f) => f.endsWith('.yaml') && f !== 'K04.yaml')) {
  let list: { id: string; name: string; headline?: string; born?: string | number }[] = []
  try {
    list = parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []
  } catch {
    console.error(`skipping ${f}`)
    continue
  }
  for (const p of list) existing.set(p.name, [...(existing.get(p.name) ?? []), { id: p.id, file: f, headline: p.headline, born: p.born === undefined ? undefined : String(p.born) }])
}

const mine: { name: string; key: string; first: number; seats: string }[] = []
const taken: { name: string; key: string; seats: string; entries: string }[] = []
const notes: string[] = []
for (const [key, list] of seats) {
  const first = Math.min(...list.map((s) => s.n))
  if (first !== 17 && first !== 18) continue
  const name = bare(key)
  // a bare name also seen on an earlier list under a note, or the other way round
  const earlier = [...seats.entries()].filter(([k, l]) => k !== key && bare(k) === name)
  if (earlier.length) notes.push(`${key}: namesake keys ${earlier.map(([k, l]) => `${k}@${l.map((s) => `${s.n}${s.list}`).join('/')}`).join(', ')}`)
  const desc = list.map((s) => `${s.n}${s.list === 'cc' ? '中委' : '候补'}`).join(' ')
  const e = existing.get(name)?.filter((x) => !NOT_THEM[name]?.includes(x.id))
  if (e?.length) taken.push({ name, key, seats: desc, entries: e.map((x) => `${x.id} (${x.file}, ${x.born ?? '?'}) ${x.headline ?? ''}`).join(' | ') })
  else mine.push({ name, key, first, seats: desc })
}

writeFileSync(join(ROOT, '.probe', 'K04-roster.json'), JSON.stringify({ mine, taken, notes }, null, 1))
const lines = [
  `first on the 17th or 18th list: ${mine.length + taken.length}; already have an entry: ${taken.length}; to build: ${mine.length}`,
  '',
  '## namesake notes',
  ...notes,
  '',
  '## already have an entry (check that it is the same person)',
  ...taken.map((t) => `${t.key}\t${t.seats}\t${t.entries}`),
  '',
  '## to build',
  ...mine.map((m) => `${m.key}\t${m.seats}`),
]
writeFileSync(join(ROOT, '.probe', 'K04-roster.txt'), lines.join('\n') + '\n')
writeFileSync(join(ROOT, '.probe', 'K04-names.txt'), [...new Set(mine.map((m) => m.name))].join(' ') + '\n')
console.log(lines[0])

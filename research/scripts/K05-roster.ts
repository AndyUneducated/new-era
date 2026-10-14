// K05 (round 4): the people who first appear on the 19th Central Committee (cc or cca) and have no entry yet.
//   node research/scripts/K05-roster.ts   -> .probe/K05-roster.json and .probe/K05-roster.txt
// A name is "first seen" in the 19th term when no 16th–18th list carries it. The parenthetical tags in K01
// (王宁（武警）, 邓小刚（四川）) are dropped for matching; HOMONYMS lists the names that an earlier list carries
// for a different person, checked by hand against birth years and careers.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const base = (s: string) => s.replace(/（.*?）/g, '').trim()

// name -> why the 19th-term holder is not the earlier one
const HOMONYMS: Record<string, string> = {
  王旭东: '16–17 届中委王旭东是信息产业部部长（1946 年生）；19 届候补王旭东是故宫博物院院长（1967 年生）',
}

type Term = { n: number; cc?: string[]; cca?: string[] }
const terms = parse(readFileSync(join(ROOT, 'content', 'congresses', 'K01.yaml'), 'utf8')) as Term[]
const earlier = new Map<string, number[]>()
for (const t of terms.filter((t) => t.n >= 16 && t.n <= 18))
  for (const raw of [...(t.cc ?? []), ...(t.cca ?? [])]) earlier.set(base(raw), [...(earlier.get(base(raw)) ?? []), t.n])
const t19 = terms.find((t) => t.n === 19)!

// names already carried by an entry, with the batch and birth date for the homonym check
const existing = new Map<string, { id: string; file: string; born?: string }[]>()
const peopleDir = join(ROOT, 'content', 'people')
for (const f of readdirSync(peopleDir).filter((f) => f.endsWith('.yaml') && !f.startsWith('K05'))) {
  let list: { id: string; name: string; aka?: string[]; born?: string | number }[] = []
  try {
    list = parse(readFileSync(join(peopleDir, f), 'utf8')) ?? []
  } catch {
    console.error(`skipping ${f}`)
    continue
  }
  for (const p of list)
    for (const n of [p.name, ...(p.aka ?? [])]) existing.set(n, [...(existing.get(n) ?? []), { id: p.id, file: f, born: p.born === undefined ? undefined : String(p.born) }])
}
const rostered = new Map<string, string>()
const rosterFiles = [join(ROOT, 'research', 'roster.yaml'), ...readdirSync(join(ROOT, 'research', 'roster')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K05')).map((f) => join(ROOT, 'research', 'roster', f))]
for (const file of rosterFiles) {
  let list: { id: string; name: string; batch?: string }[] = []
  try {
    list = parse(readFileSync(file, 'utf8')) ?? []
  } catch {
    continue
  }
  for (const r of list ?? []) rostered.set(r.name, `${r.id} (${r.batch ?? ''})`)
}

type Row = { raw: string; name: string; list: 'cc' | 'cca'; note?: string }
const mine: Row[] = []
const skippedEarlier: string[] = []
const skippedExisting: string[] = []
for (const [list, names] of [['cc', t19.cc ?? []], ['cca', t19.cca ?? []]] as const)
  for (const raw of names) {
    const name = base(raw)
    if (earlier.has(name) && !HOMONYMS[name]) {
      skippedEarlier.push(`${raw}  (${earlier.get(name)!.join(',')})`)
      continue
    }
    const ex = existing.get(name)
    if (ex) {
      skippedExisting.push(`${raw}  -> ${ex.map((e) => `${e.id} ${e.file} ${e.born ?? '?'}`).join(' | ')}`)
      continue
    }
    mine.push({ raw, name, list, note: HOMONYMS[name] ?? (rostered.has(name) ? `rostered: ${rostered.get(name)}` : undefined) })
  }

writeFileSync(join(ROOT, '.probe', 'K05-roster.json'), JSON.stringify(mine, null, 1))
const lines = [
  `19th cc ${t19.cc?.length} + cca ${t19.cca?.length}`,
  `first seen in the 19th term: ${mine.length + skippedExisting.length}`,
  `already have an entry: ${skippedExisting.length}`,
  `to build: ${mine.length}`,
  '',
  '## to build',
  ...mine.map((r) => `${r.list}\t${r.raw}${r.note ? `\t${r.note}` : ''}`),
  '',
  '## already have an entry (check homonyms)',
  ...skippedExisting,
  '',
  '## on an earlier list (check homonyms)',
  ...skippedEarlier,
]
writeFileSync(join(ROOT, '.probe', 'K05-roster.txt'), lines.join('\n') + '\n')
console.log(lines.slice(0, 4).join('\n'))

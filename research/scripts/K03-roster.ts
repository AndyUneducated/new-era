// K03 roster: people whose first CC / alternate list is the 16th (content/congresses/K01.yaml), minus names
// that already have an entry (content/people), a planned id (research/roster.yaml) or another batch's roster.
//   node research/scripts/K03-roster.ts   -> .probe/K03-roster.json (names, with the term-16 list each is on)
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (p: string) => parse(readFileSync(join(ROOT, p), 'utf8'))

type Term = { n: number; cc?: string[]; cca?: string[] }
const terms = read('content/congresses/K01.yaml') as Term[]
// a name with a bracketed note (王宁（武警）) is the bare name plus a disambiguator
const bare = (s: string) => s.replace(/（.*?）/g, '').trim()

const firstTerm = new Map<string, number>()
for (const t of [...terms].sort((a, b) => a.n - b.n))
  for (const name of [...(t.cc ?? []), ...(t.cca ?? [])]) if (!firstTerm.has(name)) firstTerm.set(name, t.n)

const t16 = terms.find((t) => t.n === 16)!
const list16 = [...(t16.cc ?? []).map((name) => ({ name, list: 'cc' })), ...(t16.cca ?? []).map((name) => ({ name, list: 'cca' }))]

// names already taken, with where they come from; ethnic names are matched on the full name and on the part before ·
const taken = new Map<string, string>()
const take = (name: string | undefined, where: string) => {
  if (!name) return
  for (const n of [name, bare(name)]) if (!taken.has(n)) taken.set(n, where)
}
for (const f of readdirSync(join(ROOT, 'content/people')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K03'))) {
  const list = (read(`content/people/${f}`) ?? []) as { id: string; name: string; aka?: string[] }[]
  for (const p of list) {
    take(p.name, `people/${f}:${p.id}`)
    for (const a of p.aka ?? []) take(a, `people/${f}:${p.id} (aka)`)
  }
}
for (const p of (read('research/roster.yaml') ?? []) as { id: string; name: string; batch: string }[]) take(p.name, `roster.yaml:${p.id}:${p.batch}`)
for (const f of readdirSync(join(ROOT, 'research/roster')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K03'))) {
  for (const p of (read(`research/roster/${f}`) ?? []) as { id: string; name: string }[]) take(p.name, `roster/${f}:${p.id}`)
}

const mine: { name: string; list: string }[] = []
const skipped: { name: string; list: string; where: string }[] = []
const notFirst: { name: string; first: number }[] = []
for (const e of list16) {
  const first = firstTerm.get(e.name)!
  if (first !== 16) {
    notFirst.push({ name: e.name, first })
    continue
  }
  const where = taken.get(e.name) ?? taken.get(bare(e.name))
  if (where) skipped.push({ ...e, where })
  else mine.push(e)
}

// names in the 16th list that recur in a later list: same person or a namesake, checked by hand
const later = new Map<string, number[]>()
for (const t of terms.filter((t) => t.n > 16))
  for (const name of [...(t.cc ?? []), ...(t.cca ?? [])]) {
    const b = bare(name)
    if (list16.some((e) => e.name === b)) later.set(b, [...(later.get(b) ?? []), t.n])
  }

mkdirSync(join(ROOT, '.probe'), { recursive: true })
writeFileSync(
  join(ROOT, '.probe', 'K03-roster.json'),
  JSON.stringify({ total16: list16.length, mine: mine.length, skipped: skipped.length, notFirst, names: mine, skippedNames: skipped, recurs: Object.fromEntries(later) }, null, 1),
)
console.log(`16th lists ${list16.length}; first-time ${list16.length - notFirst.length}; already taken ${skipped.length}; K03 ${mine.length}`)

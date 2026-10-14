// K03 ids: research/roster/K03.yaml against .probe/K03-roster.json and every id elsewhere on the site;
// once content/people/K03.yaml exists, also which roster names still have no card.
//   node research/scripts/K03-check.ts   -> .probe/K03-check.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (p: string) => parse(readFileSync(join(ROOT, p), 'utf8'))

type Entry = { id: string; name: string }
const mine = read('research/roster/K03.yaml') as Entry[]
const want = (read('.probe/K03-roster.json').names as { name: string }[]).map((n) => n.name)

const taken = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content/people')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K03')))
  for (const p of (read(`content/people/${f}`) ?? []) as Entry[]) taken.set(p.id, `people/${f}`)
for (const p of (read('research/roster.yaml') ?? []) as Entry[]) if (p?.id) taken.set(p.id, 'roster.yaml')
for (const f of readdirSync(join(ROOT, 'research/roster')).filter((f) => f.endsWith('.yaml') && !f.startsWith('K03')))
  for (const p of (read(`research/roster/${f}`) ?? []) as Entry[]) if (p?.id) taken.set(p.id, `roster/${f}`)

const out: string[] = [`roster ${mine.length}, wanted ${want.length}`]
const seen = new Set<string>()
for (const p of mine) {
  if (seen.has(p.id)) out.push(`DUP ${p.id}`)
  seen.add(p.id)
  if (taken.has(p.id)) out.push(`TAKEN ${p.id} ${p.name} by ${taken.get(p.id)}`)
  if (!want.includes(p.name)) out.push(`EXTRA ${p.name}`)
  for (const [id, where] of taken)
    if (id.startsWith(`${p.id}-`) || p.id.startsWith(`${id}-`)) out.push(`near ${p.id} ${p.name} ~ ${id} (${where})`)
}
for (const n of want) if (!mine.some((p) => p.name === n)) out.push(`MISSING ${n}`)

if (existsSync(join(ROOT, 'content/people/K03.yaml'))) {
  const cards = (read('content/people/K03.yaml') ?? []) as Entry[]
  const ids = new Set(cards.map((c) => c.id))
  out.push(`cards ${cards.length}`)
  for (const c of cards) if (!mine.some((p) => p.id === c.id && p.name === c.name)) out.push(`CARD off roster ${c.id} ${c.name}`)
  out.push(`no card (${mine.filter((p) => !ids.has(p.id)).length}): ${mine.filter((p) => !ids.has(p.id)).map((p) => p.name).join(' ')}`)
}
writeFileSync(join(ROOT, '.probe', 'K03-check.txt'), `${out.join('\n')}\n`)
console.log(`${out.length} lines -> .probe/K03-check.txt`)

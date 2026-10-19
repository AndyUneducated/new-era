// Dumps every policy already written (concepts and concept-more), so LK3 can reuse names, dates and sources.
//   node research/scripts/LK3-pol.ts   -> .probe/LK3-policies.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const yamls = (d: string) => readdirSync(join(ROOT, 'content', d)).filter((f) => f.endsWith('.yaml'))
type Pol = { date: string; name: string; text: string; events?: string[]; cite: string }
const out: string[] = []
const dump = (file: string, id: string, ps: Pol[] | undefined) => {
  for (const p of ps ?? []) out.push(`${String(p.date)}\t${id}\t${p.name}\t${p.cite}\t${(p.events ?? []).join(',')}\t${file}`)
}
for (const f of yamls('concepts'))
  for (const c of (parse(readFileSync(join(ROOT, 'content', 'concepts', f), 'utf8')) ?? []) as { id: string; policies?: Pol[] }[]) dump(f, c.id, c.policies)
for (const f of yamls('concept-more'))
  for (const [id, m] of Object.entries((parse(readFileSync(join(ROOT, 'content', 'concept-more', f), 'utf8')) ?? {}) as Record<string, { policies?: Pol[] }>)) dump('more/' + f, id, m?.policies)
out.sort()
writeFileSync(join(ROOT, '.probe', 'LK3-policies.txt'), out.join('\n') + '\n')
console.log(out.length)

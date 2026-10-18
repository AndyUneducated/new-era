// Compact view of the existing cards on the R05 list: fall steps (date | cite | first 50 chars) and cites.
//   node research/scripts/R05-have.ts   -> .probe/R05-have.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type P = { id: string; name: string; status: string; fall?: { date: string; text: string; cite: string }[]; cites: string[]; positions?: unknown[] }
const people = new Map<string, P & { file: string }>()
for (const f of readdirSync(join(ROOT, 'content', 'people')).filter((f) => f.endsWith('.yaml')))
  try {
    for (const p of (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) as P[]) ?? []) people.set(p.id, { ...p, file: f })
  } catch {}
const list = (parse(readFileSync(join(ROOT, 'research', 'falls-list', 'R05.yaml'), 'utf8')) as { name: string; id: string }[]).filter((r) => r.id)
const out: string[] = []
for (const r of list) {
  const p = people.get(r.id)
  if (!p) {
    out.push(`## ${r.id} MISSING`)
    continue
  }
  out.push(`## ${p.id} ${p.name} ${p.file} ${p.status} positions=${p.positions?.length ?? 0}`)
  for (const s of p.fall ?? []) out.push(`  ${s.date} | ${s.cite} | ${s.text.slice(0, 50)}`)
  out.push(`  cites: ${p.cites.join(' ')}`)
}
writeFileSync(join(ROOT, '.probe', 'R05-have.txt'), out.join('\n') + '\n')
console.log(out.length, 'lines')

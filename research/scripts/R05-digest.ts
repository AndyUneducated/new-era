// For people in research/falls-list/R05.yaml that already have a card: the card's fall steps and the stored text of
// each fall source (the expulsion notice in full, others shortened), to write content/falls/R05.yaml from.
//   node research/scripts/R05-digest.ts [from] [to]   -> .probe/R05-digest.txt (list rows from..to, 0-based)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type P = { id: string; name: string; status: string; statusNote?: string; fall?: { date: string; text: string; cite: string }[]; cites: string[]; headline?: string; bio?: string }
const people = new Map<string, P & { file: string }>()
for (const f of readdirSync(join(ROOT, 'content', 'people')).filter((f) => f.endsWith('.yaml')))
  try {
    for (const p of (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) as P[]) ?? []) people.set(p.id, { ...p, file: f })
  } catch {}
const list = (parse(readFileSync(join(ROOT, 'research', 'falls-list', 'R05.yaml'), 'utf8')) as { name: string; id: string; done: boolean }[]).filter((r) => r.id)
const [from, to] = [Number(process.argv[2] ?? 0), Number(process.argv[3] ?? list.length)]
const text = (id: string) => {
  const p = join(ROOT, 'sources', 'text', `${id}.txt`)
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}
const out: string[] = []
for (const r of list.slice(from, to)) {
  const p = people.get(r.id)
  if (!p) continue
  out.push(`######## ${p.id} ${p.name} (${p.file}) status=${p.status} done=${r.done}`, `headline: ${p.headline}`, `note: ${p.statusNote ?? ''}`)
  for (const s of p.fall ?? []) out.push(`  FALL ${s.date} | ${s.text} | ${s.cite}`)
  out.push(`  cites: ${p.cites.join(', ')}`)
  const seen = new Set<string>()
  for (const s of p.fall ?? []) {
    const id = s.cite.split('@')[0]
    if (seen.has(id)) continue
    seen.add(id)
    const t = text(id).replace(/\n+/g, ' ')
    const full = /开除|处分/.test(s.text)
    out.push(`  --- ${id} (${t.length} chars)`, `  ${full ? t.slice(0, 3000) : t.slice(0, 700)}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'R05-digest.txt'), out.join('\n') + '\n')
console.log(out.length, 'lines')

// RL7: succession chains ("甲 → 乙 → 丙" lines in archived texts, mostly Wikipedia navboxes) that contain a list person
// still without relations; prints neighbours with their card ids. → .probe/RL7-chain.txt
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R19-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
type P = { id: string; name: string; aka?: string[] }
const people = d.people as unknown as P[]
const byName = new Map<string, string[]>()
for (const p of people) for (const n of [p.name, ...(p.aka ?? [])]) if (n) byName.set(n, [...(byName.get(n) ?? []), p.id])
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const clean = (s: string) => s.replace(/[（(].*?[)）]/g, '').replace(/\s+/g, '').trim()
const out: string[] = []
for (const [id, name] of list) {
  if (related.has(id)) continue
  const seen = new Set<string>()
  for (const [sid, t] of d.texts) {
    if (!t.includes(name)) continue
    for (const line of t.split(/\n/)) {
      if (!line.includes('→') || !line.includes(name)) continue
      const parts = line.split(/→|：|:/).map(clean)
      const i = parts.findIndex((x) => x === name || x.endsWith(name))
      if (i < 0) continue
      const nb = [parts[i - 1], parts[i + 1]].map((x) => (x ? `${x}[${(byName.get(x) ?? ['-']).join('/')}]` : '·'))
      const k = nb.join('|')
      if (seen.has(k)) continue
      seen.add(k)
      out.push(`${name} (${id})  prev ${nb[0]}  next ${nb[1]}  [${sid}] ${line.trim().slice(0, 160)}`)
    }
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL7-chain.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

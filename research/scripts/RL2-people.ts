// RL2: every person on file (id, name, aka, headline, related?) → .probe/RL2-people.txt
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const out = d.people.map((p) => `${p.id}\t${p.name}\t${p.aka.join('/')}\t${related.has(p.id) ? 'R' : ''}\t${(p as { headline?: string }).headline ?? ''}`)
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL2-people.txt'), out.join('\n') + '\n')

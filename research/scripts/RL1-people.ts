// RL1: one line per person (id, name, tier, roles, status, relation count, headline) so names can be
// looked up with Grep. Run: node research/scripts/RL1-people.ts --batch=RL1   → .probe/RL1-people.txt
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const n = new Map<string, number>()
for (const r of d.relations) for (const x of [r.a, r.b]) n.set(x, (n.get(x) ?? 0) + 1)
const out = d.people.map((p) => [p.id, p.name, p.tier, p.roles.join(','), p.status, n.get(p.id) ?? 0, p.headline].join('\t'))
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL1-people.txt'), out.join('\n') + '\n')
console.log(out.length)

// K09: coverage of the 171 case people (research/lists/R17-case-people-no-relation.txt) by any relation file,
// how many RL5 adds, and duplicate pairs; writes .probe/K09-count.txt
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path, read } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R17-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .map((l) => l.split('\t'))
type R = { a: string; b: string; kind: string }
const mine = ((read('content', 'relations', 'RL5.yaml') ?? []) as R[]) ?? []
const old: R[] = []
for (const f of readdirSync(path('content', 'relations')).filter((f) => f.endsWith('.yaml') && f !== 'RL5.yaml'))
  old.push(...(((read('content', 'relations', f) ?? []) as R[]) ?? []))
const ids = (rs: R[]) => new Set(rs.flatMap((r) => [r.a, r.b]))
const inOld = ids(old)
const inAll = ids([...old, ...mine])
const pairs = new Map<string, number>()
for (const r of [...old, ...mine]) {
  const k = [r.a, r.b].sort().join('|') + '|' + r.kind
  pairs.set(k, (pairs.get(k) ?? 0) + 1)
}
const dupMine = mine.filter((r) => (pairs.get([r.a, r.b].sort().join('|') + '|' + r.kind) ?? 0) > 1).map((r) => `${r.a}|${r.b}`)
const out = [
  `RL5 relations ${mine.length}`,
  `covered before RL5 ${rows.filter((r) => inOld.has(r[0])).length} / ${rows.length}`,
  `covered now ${rows.filter((r) => inAll.has(r[0])).length} / ${rows.length}`,
  `RL5 pairs also elsewhere: ${dupMine.join(' ')}`,
  '',
  ...rows.filter((r) => !inAll.has(r[0])).map((r) => `${r[0]}\t${r[1]}\t${r[3]}\t${r[4]}`),
]
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'K09-count.txt'), out.join('\n') + '\n')
console.log(out.slice(0, 4).join(' | '))

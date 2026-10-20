// K08: coverage of the 395 case people (research/lists/R15-case-people-no-relation.txt) by any relation file,
// and how many of them RL3 adds; writes .probe/K08-count.txt
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path, read } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .map((l) => l.split('\t'))
type R = { a: string; b: string }
const mine = ((read('content', 'relations', 'RL3.yaml') ?? []) as R[]) ?? []
const old: R[] = []
for (const f of readdirSync(path('content', 'relations')).filter((f) => f.endsWith('.yaml') && f !== 'RL3.yaml'))
  old.push(...(((read('content', 'relations', f) ?? []) as R[]) ?? []))
const ids = (rs: R[]) => new Set(rs.flatMap((r) => [r.a, r.b]))
const inOld = ids(old)
const inAll = ids([...old, ...mine])
const pairs = new Map<string, number>()
for (const r of [...old, ...mine]) {
  const k = [r.a, r.b].sort().join('|')
  pairs.set(k, (pairs.get(k) ?? 0) + 1)
}
const dupMine = mine.filter((r) => (pairs.get([r.a, r.b].sort().join('|')) ?? 0) > 1).map((r) => `${r.a}|${r.b}`)
const out = [
  `RL3 relations ${mine.length}`,
  `covered before RL3 ${rows.filter((r) => inOld.has(r[0])).length} / ${rows.length}`,
  `covered now ${rows.filter((r) => inAll.has(r[0])).length} / ${rows.length}`,
  `RL3 pairs also elsewhere: ${dupMine.join(' ')}`,
  '',
  ...rows.filter((r) => !inAll.has(r[0])).map((r) => `${r[0]}\t${r[1]}\t${r[3]}\t${r[4]}`),
]
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'K08-count.txt'), out.join('\n') + '\n')
console.log(out.slice(0, 3).join(' | '))

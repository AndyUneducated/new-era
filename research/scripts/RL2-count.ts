// Coverage of the 395 case people by content/relations/RL2.yaml; writes .probe/RL2-count.txt
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path, read } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split('\n')
  .filter((l) => l.trim())
  .map((l) => l.split('\t'))
const mine = (read('content', 'relations', 'RL2.yaml') ?? []) as { a: string; b: string }[]
const all: { a: string; b: string }[] = []
for (const f of readdirSync(path('content', 'relations')).filter((f) => f.endsWith('.yaml'))) {
  all.push(...(((read('content', 'relations', f) ?? []) as { a: string; b: string }[]) ?? []))
}
const ids = (rs: { a: string; b: string }[]) => new Set(rs.flatMap((r) => [r.a, r.b]))
const inMine = ids(mine)
const inAll = ids(all)
const pairs = new Set<string>()
const dup: string[] = []
for (const r of mine) {
  const k = [r.a, r.b].sort().join('|')
  if (pairs.has(k)) dup.push(k)
  pairs.add(k)
}
const missing = rows.filter((r) => !inMine.has(r[0]))
const out = [
  `RL2 relations ${mine.length}`,
  `covered by RL2 ${rows.length - missing.length} / ${rows.length}`,
  `covered by any file ${rows.filter((r) => inAll.has(r[0])).length}`,
  `dup pairs ${dup.join(' ')}`,
  '',
  ...missing.map((r) => `${inAll.has(r[0]) ? '+' : ' '} ${r[0]}\t${r[1]}\t${r[3]}\t${r[4]}`),
]
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL2-count.txt'), out.join('\n') + '\n')

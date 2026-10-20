// RL7: coverage of the 215 case people (research/lists/R19-case-people-no-relation.txt) by any relation file,
// RL7 counts by kind, duplicate pairs, and ids that have no card; writes .probe/RL7-count.txt
// --pairs=a|b,c|d prints any existing relation between those pairs.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path, read } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R19-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .map((l) => l.split('\t'))
type R = { a: string; b: string; kind: string; _f?: string }
const mine = (((read('content', 'relations', 'RL7.yaml') ?? []) as R[]) ?? []).map((r) => ({ ...r, _f: 'RL7' }))
const old: R[] = []
for (const f of readdirSync(path('content', 'relations')).filter((f) => f.endsWith('.yaml') && f !== 'RL7.yaml'))
  old.push(...((((read('content', 'relations', f) ?? []) as R[]) ?? []).map((r) => ({ ...r, _f: f }))))
const ids = (rs: R[]) => new Set(rs.flatMap((r) => [r.a, r.b]))
const inOld = ids(old)
const inAll = ids([...old, ...mine])
const key = (r: R) => [r.a, r.b].sort().join('|') + '|' + r.kind
const pairs = new Map<string, string[]>()
for (const r of [...old, ...mine]) pairs.set(key(r), [...(pairs.get(key(r)) ?? []), r._f!])
const dup = mine.filter((r) => (pairs.get(key(r)) ?? []).length > 1).map((r) => `${key(r)} (${pairs.get(key(r))!.join(',')})`)
const people = new Set<string>()
for (const f of readdirSync(path('content', 'people')).filter((f) => f.endsWith('.yaml')))
  for (const m of readFileSync(path('content', 'people', f), 'utf8').matchAll(/^- id: ([\w-]+)/gm)) people.add(m[1])
const noCard = [...ids(mine)].filter((i) => !people.has(i))
const byKind = new Map<string, number>()
for (const r of mine) byKind.set(r.kind, (byKind.get(r.kind) ?? 0) + 1)
const ask = process.argv.find((a) => a.startsWith('--pairs='))?.slice(8).split(',') ?? []
const asked = ask.map((p) => {
  const [x, y] = p.split('|')
  const hit = old.filter((r) => (r.a === x && r.b === y) || (r.a === y && r.b === x))
  return `${p}: ${hit.map((r) => `${r.kind}@${r._f}`).join(' ') || '-'}`
})
const newly = rows.filter((r) => !inOld.has(r[0]) && inAll.has(r[0])).map((r) => r[0])
const out = [
  `RL7 relations ${mine.length} ${[...byKind].map(([k, n]) => `${k}=${n}`).join(' ')}`,
  `covered before RL7 ${rows.filter((r) => inOld.has(r[0])).length} / ${rows.length}`,
  `covered now ${rows.filter((r) => inAll.has(r[0])).length} / ${rows.length} (still missing ${rows.filter((r) => !inAll.has(r[0])).length})`,
  `RL7 dup pairs: ${dup.join(' ')}`,
  `RL7 ids without card: ${noCard.join(' ')}`,
  `newly covered: ${newly.join(' ')}`,
  ...asked,
  '',
  ...rows.filter((r) => !inAll.has(r[0])).map((r) => `${r[0]}\t${r[1]}\t${r[3]}\t${r[4]}`),
]
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL7-count.txt'), out.join('\n') + '\n')
console.log('ok')

// Tallies content/falls/A02.yaml and the falls list for the batch report.
//   node research/scripts/A02-tally.ts   -> .probe/A02-tally.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type C = { politics?: { level: string }; outcome?: string; status?: string; notice?: { quotes?: string[] } }
const recs = parse(readFileSync('content/falls/A02.yaml', 'utf8')) as Record<string, C>
const list = parse(readFileSync('research/falls-list/A02.yaml', 'utf8')) as { name: string; id: string; done: boolean }[]
const count = (f: (c: C) => string | undefined) => {
  const m = new Map<string, string[]>()
  for (const [id, c] of Object.entries(recs)) {
    const k = f(c) ?? '-'
    m.set(k, [...(m.get(k) ?? []), id])
  }
  return [...m].map(([k, v]) => `${k}\t${v.length}\t${v.join(' ')}`).join('\n')
}
const quotes = new Map<string, number>()
for (const c of Object.values(recs)) for (const q of c.notice?.quotes ?? []) quotes.set(q, (quotes.get(q) ?? 0) + 1)
const out = [
  `records ${Object.keys(recs).length}; list ${list.length}, done ${list.filter((x) => x.done).length}, left ${list.filter((x) => !x.done).map((x) => x.name).join(' ')}`,
  `listed but no record: ${list.filter((x) => x.done && !recs[x.id]).map((x) => x.name).join(' ')}`,
  '## politics', count((c) => c.politics?.level),
  '## outcome', count((c) => c.outcome),
  '## quotes', [...quotes].map(([q, n]) => `${n}\t${q}`).join('\n'),
]
writeFileSync('.probe/A02-tally.txt', out.join('\n') + '\n')

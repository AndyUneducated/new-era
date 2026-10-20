// CS10 one-off: dump cards and case records of the people the two topics name, for fact-checking prose.
// Run: node research/scripts/CS10-dump.ts id1 id2 ...   Writes .probe/cs10-dump.txt
import { writeFileSync } from 'node:fs'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const out: string[] = []
for (const id of process.argv.slice(2)) {
  const p = d.people.find((x) => x.id === id)
  if (!p) { out.push(`MISSING ${id}`); continue }
  const rec = d.falls.get(id)
  out.push(`### ${id} ${p.name} ${p.status} born ${p.born ?? '-'} | ${p.headline}`)
  out.push(`bio: ${p.bio ?? ''}`)
  for (const x of p.positions) out.push(`  pos ${x.from ?? ''}–${x.to ?? ''} ${x.title} [${x.cite}]`)
  for (const s of p.fall) out.push(`  fall ${s.date} ${s.text} [${s.cite}]`)
  if (rec) {
    const { id: _id, ...r } = rec as Record<string, unknown>
    out.push(`  rec ${JSON.stringify(r)}`)
  }
  const cases = d.cases.filter((c) => c.people.includes(id)).map((c) => c.id)
  out.push(`  cases ${cases.join(',')}`)
}
writeFileSync('.probe/cs10-dump.txt', out.join('\n') + '\n')
console.log('ok')

// T01 one-off: summarise the Wikidata records fetched for the T01 candidates -> .probe/T01-wd-summary.txt
import { readFileSync, writeFileSync } from 'node:fs'

const found = JSON.parse(readFileSync('.probe/T01.json', 'utf8')) as Record<string, { id: string }[]>
const out: string[] = []
for (const [name, hits] of Object.entries(found)) {
  for (const { id } of hits) {
    let r: any
    try {
      r = JSON.parse(readFileSync(`research/wikidata/${id}.json`, 'utf8'))
    } catch {
      continue
    }
    out.push(`## ${name} ${id} ${r.label} :: ${r.description ?? ''} | born ${r.born ?? '-'} | ${r.birthplace ?? '-'}`)
    for (const p of r.positions) out.push(`   ${p.label} ${p.from ?? ''}–${p.to ?? ''}`)
  }
}
writeFileSync('.probe/T01-wd-summary.txt', out.join('\n') + '\n', 'utf8')

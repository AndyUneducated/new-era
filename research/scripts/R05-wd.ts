// Prints label / description / born / birthplace of the Wikidata records R05 cites, to check identities.
// Usage: node research/scripts/R05-wd.ts Q1 Q2 ... → .probe/R05-wd.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const out: string[] = []
for (const q of process.argv.slice(2)) {
  const f = `research/wikidata/${q}.json`
  if (!existsSync(f)) {
    out.push(`${q}: missing`)
    continue
  }
  const r = JSON.parse(readFileSync(f, 'utf8'))
  const pos = (r.positions ?? []).map((p: { label: string; from?: string; to?: string }) => `${p.label}${p.from ? ` ${p.from}–${p.to ?? ''}` : ''}`)
  out.push(`${q} ${r.label} | ${r.description ?? ''} | born ${r.born ?? '?'} | ${r.birthplace ?? ''} | ${pos.join('; ')}`)
}
writeFileSync('.probe/R05-wd.txt', out.join('\n') + '\n')

// Summarise research/wikidata/<QID>.json records into .probe/R04-wd.txt (label, description, birth, birthplace, positions).
//   node research/scripts/R04-wd.ts Q1 Q2 ...
import { readFileSync, writeFileSync } from 'node:fs'

const out: string[] = []
for (const q of process.argv.slice(2)) {
  try {
    const r = JSON.parse(readFileSync(`research/wikidata/${q}.json`, 'utf8'))
    const pos = (r.positions ?? []).map((p: { label?: string; from?: string; to?: string }) => `${p.label ?? '?'} ${p.from ?? ''}–${p.to ?? ''}`)
    out.push(`${q} ${r.label} | ${r.description ?? ''} | born ${r.birth ?? r.born ?? '?'} | ${r.birthplace ?? ''}\n   ${pos.join('; ')}`)
  } catch (e) {
    out.push(`${q} ERR ${(e as Error).message}`)
  }
}
writeFileSync('.probe/R04-wd.txt', out.join('\n'), 'utf8')

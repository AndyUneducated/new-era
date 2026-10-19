// Dump the Wikidata records of R09 cards next to each card's name, for checking the QID matches.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'

const cards = parse(readFileSync('content/people/R09.yaml', 'utf8')) as { id: string; name: string; born?: string; ids?: { wikidata?: string } }[]
const out: string[] = []
for (const c of cards) {
  const q = c.ids?.wikidata
  if (!q) continue
  const p = `research/wikidata/${q}.json`
  if (!existsSync(p)) { out.push(`${c.id} ${c.name} ${q} MISSING`); continue }
  const r = JSON.parse(readFileSync(p, 'utf8'))
  const pos = (r.positions ?? []).map((x: { label: string; from?: string; to?: string }) => `${x.label}${x.from ? ' ' + x.from : ''}${x.to ? '~' + x.to : ''}`).join(' | ')
  out.push(`${c.id} ${c.name} card-born=${c.born ?? ''} ${q} label=${r.label} desc=${r.description ?? ''} born=${r.born ?? ''} place=${r.birthplace ?? ''}\n    ${pos}`)
}
writeFileSync('.probe/R09-wdcheck.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

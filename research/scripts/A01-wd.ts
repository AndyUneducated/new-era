import { readFileSync, writeFileSync } from 'node:fs'
const ids = process.argv.slice(2)
const out = []
for (const q of ids) {
  try {
    const r = JSON.parse(readFileSync(`research/wikidata/${q}.json`, 'utf8'))
    out.push(`${q}\t${r.label}\t${r.description ?? ''}\tborn=${r.birth ?? ''}\tplace=${r.birthplace ?? ''}\t${(r.positions ?? []).map((p) => p.label ?? p.position ?? JSON.stringify(p)).join('; ').slice(0, 200)}`)
  } catch (e) { out.push(`${q}\tMISSING`) }
}
writeFileSync('.probe/a01-wd.txt', out.join('\n'), 'utf8')

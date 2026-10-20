// dump the stored texts of the sources behind the listed people: node research/scripts/R12-dump.mjs out.txt id1 id2 ...
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
const [out, ...ids] = process.argv.slice(2)
const d = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const people = new Map(d.people.map((p) => [p.id, p]))
const lines = []
for (const id of ids) {
  const p = people.get(id)
  lines.push(`######## ${id} ${p.name}`)
  const cs = new Set([...(p.fall ?? []).map((s) => s.cite), ...(p.case?.trigger ? [p.case.trigger.cite] : []), ...(p.case?.politics?.cites ?? []), ...(p.cites ?? [])])
  for (const c of cs) {
    if (c.startsWith('wd-')) continue
    const f = `sources/text/${c}.txt`
    if (!existsSync(f)) {
      lines.push(`=== ${c}: NO TEXT`)
      continue
    }
    const t = readFileSync(f, 'utf8').replace(/\n{2,}/g, '\n')
    lines.push(`=== ${c} (${t.length})`)
    lines.push(t.slice(0, 2200))
  }
}
writeFileSync(out, lines.join('\n'), 'utf8')

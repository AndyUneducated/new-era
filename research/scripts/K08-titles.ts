// K08 research aid: zhwiki titles for list people still without relations, via their card's Wikidata id
// → .probe/K08-titles2.txt (one title per line) and .probe/K08-titles2-map.txt (id \t QID \t title)
import { readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const byId = new Map(d.people.map((p) => [p.id, p as unknown as { ids?: { wikidata?: string } }]))
const q: [string, string][] = []
for (const [id] of list) {
  if (related.has(id)) continue
  const w = byId.get(id)?.ids?.wikidata
  if (w) q.push([id, w])
}
const map: string[] = []
const titles: string[] = []
for (let i = 0; i < q.length; i += 40) {
  const chunk = q.slice(i, i + 40)
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=sitelinks&sitefilter=zhwiki&ids=${chunk.map((c) => c[1]).join('|')}`
  const res = await fetch(url, { headers: { 'User-Agent': 'new-era-research/1.0' } })
  const j = (await res.json()) as { entities: Record<string, { sitelinks?: { zhwiki?: { title: string } } }> }
  for (const [id, w] of chunk) {
    const t = j.entities[w]?.sitelinks?.zhwiki?.title
    map.push(`${id}\t${w}\t${t ?? '-'}`)
    if (t) titles.push(t.replace(/ /g, '_'))
  }
}
writeFileSync(path('.probe', 'K08-titles2.txt'), titles.join('\n') + '\n')
writeFileSync(path('.probe', 'K08-titles2-map.txt'), map.join('\n') + '\n')
console.log('ok', titles.length, q.length)

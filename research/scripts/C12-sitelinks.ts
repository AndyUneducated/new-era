// Label, description and zh / en Wikipedia titles for a list of QIDs.
//   node research/scripts/C12-sitelinks.ts Q1 Q2 ...   -> .probe/C12-sitelinks.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const ids = process.argv.slice(2)
const out: string[] = []
for (let i = 0; i < ids.length; i += 50) {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ action: 'wbgetentities', format: 'json', ids: ids.slice(i, i + 50).join('|'), props: 'labels|descriptions|sitelinks', languages: 'zh-cn|zh-hans|zh|en' }))
    u.searchParams.set(k, v)
  const r = await (await fetch(u, { headers: { 'User-Agent': 'new-era-research/0.1' } })).json()
  // oxlint-disable-next-line typescript/no-explicit-any
  for (const e of Object.values(r.entities as Record<string, any>)) {
    const l = e.labels?.['zh-cn']?.value ?? e.labels?.['zh-hans']?.value ?? e.labels?.zh?.value ?? e.labels?.en?.value
    const d = e.descriptions?.['zh-cn']?.value ?? e.descriptions?.['zh-hans']?.value ?? e.descriptions?.zh?.value ?? e.descriptions?.en?.value ?? ''
    out.push(`${e.id}\t${l}\t${d}\tzh=${e.sitelinks?.zhwiki?.title ?? '-'}\ten=${e.sitelinks?.enwiki?.title ?? '-'}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'C12-sitelinks.txt'), out.join('\n') + '\n')
console.log(out.length)

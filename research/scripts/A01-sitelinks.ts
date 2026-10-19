// A01: zhwiki titles for a list of QIDs (discovery only) -> .probe/a01-sitelinks.txt
import { writeFileSync } from 'node:fs'

const ids = process.argv.slice(2)
const out: string[] = []
for (let i = 0; i < ids.length; i += 50) {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ action: 'wbgetentities', ids: ids.slice(i, i + 50).join('|'), props: 'sitelinks|claims', sitefilter: 'zhwiki', format: 'json' })) u.searchParams.set(k, v)
  const r = await (await fetch(u, { headers: { 'User-Agent': 'new-era-research/0.1' } })).json()
  for (const [q, e] of Object.entries<any>(r.entities)) {
    const born = e.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time ?? ''
    out.push(`${q}\t${e.sitelinks?.zhwiki?.title ?? ''}\t${born}`)
  }
}
writeFileSync('.probe/a01-sitelinks.txt', out.join('\n'), 'utf8')
console.log(out.length)

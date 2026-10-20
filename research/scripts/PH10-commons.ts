// Wikimedia Commons file search for picking colour portraits: each argument is a search string, or Q<id> for the
// Wikidata image (P18) of that item. Writes .probe/PH10-commons.txt (title, size, thumb URL).
//   node research/scripts/PH10-commons.ts "Joseph Stiglitz" Q134798 …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const out = '.probe/PH10-commons.txt'
writeFileSync(out, '')
const api = async (params: Record<string, string>) =>
  (await (await fetch(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`, { headers: { 'User-Agent': UA } })).json()) as any
for (const arg of process.argv.slice(2)) {
  try {
    let titles: string[]
    if (/^Q\d+$/.test(arg)) {
      const wd = (await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${arg}.json`, { headers: { 'User-Agent': UA } })).json()) as any
      titles = (wd.entities[arg]?.claims?.P18 ?? []).map((c: any) => `File:${c.mainsnak.datavalue.value}`)
    } else {
      const r = await api({ action: 'query', list: 'search', srnamespace: '6', srlimit: '12', srsearch: arg })
      titles = r.query.search.map((s: any) => s.title)
    }
    appendFileSync(out, `== ${arg}\n`)
    if (titles.length) {
      const r = await api({ action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|size', iiurlwidth: '480' })
      for (const p of Object.values(r.query.pages) as any[]) {
        const i = p.imageinfo?.[0]
        appendFileSync(out, `${p.title}\t${i?.width}x${i?.height}\t${i?.thumburl}\n`)
      }
    }
    appendFileSync(out, '\n')
  } catch (e) {
    appendFileSync(out, `== ${arg}\nERR ${(e as Error).message}\n\n`)
  }
}
console.log('done')

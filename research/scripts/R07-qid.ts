// R07: Wikidata QIDs of exact zh.wikipedia page titles (pageprops.wikibase_item).
//   node research/scripts/R07-qid.ts title ...   -> .probe/R07-qid.txt  (title <tab> QID)
import { writeFileSync } from 'node:fs'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const titles = process.argv.slice(2)
const out: string[] = []
for (let i = 0; i < titles.length; i += 40) {
  const batch = titles.slice(i, i + 40)
  const u = `https://zh.wikipedia.org/w/api.php?action=query&format=json&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(batch.join('|'))}`
  const j = await (await fetch(u, { headers: { 'User-Agent': UA } })).json()
  const back = new Map<string, string>()
  for (const r of [...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])]) back.set(r.to, back.get(r.from) ?? r.from)
  for (const p of Object.values(j.query?.pages ?? {}) as { title: string; pageprops?: { wikibase_item?: string } }[])
    out.push(`${back.get(p.title) ?? p.title}\t${p.pageprops?.wikibase_item ?? 'NONE'}`)
}
writeFileSync('.probe/R07-qid.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

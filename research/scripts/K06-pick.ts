// Picks the Wikidata item for each K06 person: among the name-search hits, the one whose birth year matches the
// 20th-list biography table, and reads its zh.wikipedia title.
//   node research/scripts/K06-pick.ts   -> .probe/K06-picks.json, .probe/K06-picks.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
type Rec = { name: string; key: string; id: string; born?: string; rank?: string; lines: string[]; wd: string[] }
const data = JSON.parse(readFileSync(join(ROOT, '.probe', 'K06-data.json'), 'utf8')) as Rec[]
// extra hits from the 50-result search (K06-wdsearch.txt)
const extra = new Map<string, string[]>()
for (const l of readFileSync(join(ROOT, '.probe', 'K06-wdsearch.txt'), 'utf8').split('\n').filter(Boolean)) {
  const [n, rest] = l.split(' :: ')
  extra.set(n, [...rest.matchAll(/Q\d+/g)].map((m) => m[0]))
}
const SKIP = /消歧义|disambiguation|朝代|dynasty|CBDB|运动员|演员|歌手|footballer|player|scholarly|article|村|街道|站|公司|大学|省份|地级市/

const cands = new Map<string, string[]>()
for (const r of data) {
  const qs = [...r.wd.filter((w) => !SKIP.test(w)).map((w) => w.split(' ')[0]), ...(extra.get(r.name) ?? [])]
  cands.set(r.key, [...new Set(qs)])
}
const all = [...new Set([...cands.values()].flat())]
type E = { id: string; claims?: Record<string, { mainsnak: { datavalue?: { value: { time?: string } } } }[]>; sitelinks?: Record<string, { title: string }>; descriptions?: Record<string, { value: string }> }
const ents = new Map<string, E>()
for (let i = 0; i < all.length; i += 50) {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ format: 'json', action: 'wbgetentities', ids: all.slice(i, i + 50).join('|'), props: 'claims|sitelinks|descriptions', languages: 'zh-cn|zh-hans|zh', sitefilter: 'zhwiki' })) u.searchParams.set(k, v)
  for (let t = 0; t < 5; t++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) {
      for (const e of Object.values((await res.json()).entities as Record<string, E>)) ents.set(e.id, e)
      break
    }
    await new Promise((ok) => setTimeout(ok, 5000 * (t + 1)))
  }
  await new Promise((ok) => setTimeout(ok, 1500))
}
const year = (e: E) => e.claims?.P569?.[0]?.mainsnak.datavalue?.value.time?.slice(1, 5)
const picks: Record<string, { qid?: string; wiki?: string; note: string }> = {}
const txt: string[] = []
for (const r of data) {
  const qs = cands.get(r.key) ?? []
  const y = r.born?.slice(0, 4)
  const match = qs.filter((q) => ents.get(q) && y && year(ents.get(q)!) === y)
  const pick = match.length === 1 ? match[0] : undefined
  const e = pick ? ents.get(pick) : undefined
  const note = pick ? 'born-year match' : match.length > 1 ? `several: ${match.join(',')}` : `no match; cands ${qs.map((q) => `${q}(${ents.get(q) ? year(ents.get(q)!) ?? '?' : 'x'})`).join(' ')}`
  picks[r.key] = { qid: pick, wiki: e?.sitelinks?.zhwiki?.title, note }
  txt.push(`${pick ? 'OK ' : '?? '} ${r.key} ${r.born ?? ''} ${pick ?? ''} ${e?.sitelinks?.zhwiki?.title ?? ''} | ${pick ? e?.descriptions?.['zh-cn']?.value ?? e?.descriptions?.zh?.value ?? '' : note}`)
}
writeFileSync(join(ROOT, '.probe', 'K06-picks.json'), JSON.stringify(picks, null, 1))
writeFileSync(join(ROOT, '.probe', 'K06-picks.txt'), txt.sort().join('\n') + '\n')
console.log(`${Object.values(picks).filter((p) => p.qid).length}/${data.length} picked`)

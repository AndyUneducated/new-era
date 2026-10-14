// K04: English (pinyin) labels of the picked Wikidata items, to derive card ids. Writes .probe/K04-en.json.
//   node research/scripts/K04-en.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const picks = JSON.parse(readFileSync(join(ROOT, '.probe', 'K04-picks.json'), 'utf8')) as Record<string, { qid: string }>
const qids = [...new Set(Object.values(picks).map((p) => p.qid).filter((q) => /^Q\d+$/.test(q)))]
const out: Record<string, string> = {}
for (let i = 0; i < qids.length; i += 50) {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ action: 'wbgetentities', format: 'json', props: 'labels', languages: 'en', ids: qids.slice(i, i + 50).join('|') })) u.searchParams.set(k, v)
  for (let a = 0; ; a++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) {
      const j = await res.json()
      for (const [q, e] of Object.entries(j.entities) as [string, { labels?: { en?: { value: string } } }][]) out[q] = e.labels?.en?.value ?? ''
      break
    }
    if (a >= 5) throw new Error(`${res.status}`)
    await new Promise((r) => setTimeout(r, 10000 * (a + 1)))
  }
  await new Promise((r) => setTimeout(r, 1500))
}
writeFileSync(join(ROOT, '.probe', 'K04-en.json'), JSON.stringify(out, null, 1))
console.log(Object.keys(out).length, 'labels')

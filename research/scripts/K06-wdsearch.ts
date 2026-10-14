// Wider Wikidata search for common names the 5-hit lookup misses: 50 hits, only official-looking descriptions.
//   node research/scripts/K06-wdsearch.ts 名字 ...   -> .probe/K06-wdsearch.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const OFFICIAL = /中将|上将|少将|将领|军|政治|书记|省长|部长|局长|主席|董事长|总经理|委员|副|politician|general|official/i
const out: string[] = []
for (const name of process.argv.slice(2)) {
  const u = new URL('https://www.wikidata.org/w/api.php')
  for (const [k, v] of Object.entries({ format: 'json', action: 'wbsearchentities', search: name, language: 'zh', uselang: 'zh-cn', type: 'item', limit: '50' })) u.searchParams.set(k, v)
  let r: { search: { id: string; label: string; description?: string }[] } | undefined
  for (let i = 0; i < 4 && !r; i++) {
    const res = await fetch(u, { headers: { 'User-Agent': UA } })
    if (res.ok) r = await res.json()
    else await new Promise((ok) => setTimeout(ok, 5000 * (i + 1)))
  }
  const hits = (r?.search ?? []).filter((h) => h.label === name && OFFICIAL.test(h.description ?? ''))
  out.push(`${name} :: ${hits.map((h) => `${h.id} ${h.description}`).join(' || ') || (r ? '(none)' : '(failed)')}`)
  await new Promise((ok) => setTimeout(ok, 1500))
}
writeFileSync(join(ROOT, '.probe', 'K06-wdsearch.txt'), out.join('\n') + '\n')
console.log(out.length)

// Dumps the wikitext of the fall-list pages that cover 2021–2023, a research aid for research/falls-list/R05.yaml.
//   node research/scripts/R05-wiki.ts   -> .probe/R05-wiki-<n>.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const pages: [string, string][] = [
  ['zh', '中共十九大至二十大期间落马官员列表'],
  ['zh', '中共十八大后落马官员列表'],
  ['en', 'Officials implicated by the anti-corruption campaign in China (2022–present)'],
  ['en', 'Officials implicated by the anti-corruption campaign in China (2017–2022)'],
]
let n = 0
for (const [lang, page] of pages) {
  const u = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  const params: Record<string, string> = { action: 'parse', page, prop: 'wikitext', format: 'json', formatversion: '2', redirects: '1' }
  if (lang === 'zh') params.variant = 'zh-cn'
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  const r = await (await fetch(u, { headers: { 'User-Agent': UA } })).json()
  const text: string = r.parse?.wikitext ?? JSON.stringify(r.error ?? r)
  writeFileSync(join(ROOT, '.probe', `R05-wiki-${n}.txt`), `=== ${lang} ${page}\n${text}`)
  console.log(n, lang, text.length)
  n++
}

// Finds and dumps the zhwiki list pages of centrally managed cadres investigated since the 18th Congress,
// as a research aid for research/falls-list/R01.yaml.
//   node research/scripts/R01-wiki-list.ts search <words>   -> .probe/R01-wiki-search.txt
//   node research/scripts/R01-wiki-list.ts page <title>     -> .probe/R01-wiki-page.txt (wikitext)
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const [mode, ...rest] = process.argv.slice(2)
const api = async (params: Record<string, string>) => {
  const u = new URL('https://zh.wikipedia.org/w/api.php')
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) u.searchParams.set(k, v)
  return (await fetch(u, { headers: { 'User-Agent': UA } })).json()
}
if (mode === 'search') {
  const r = await api({ action: 'query', list: 'search', srsearch: rest.join(' '), srlimit: '30' })
  writeFileSync(join(ROOT, '.probe/R01-wiki-search.txt'), r.query.search.map((s: { title: string; size: number }) => `${s.title}\t${s.size}`).join('\n'))
} else {
  const r = await api({ action: 'parse', page: rest.join(' '), prop: 'wikitext', variant: 'zh-cn' })
  writeFileSync(join(ROOT, '.probe/R01-wiki-page.txt'), r.parse?.wikitext ?? JSON.stringify(r))
}
console.log('ok')

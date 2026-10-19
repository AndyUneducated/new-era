// zh.wikipedia full-text search, top hits per query.
//   node research/scripts/C12-wpsearch.ts "查询1" "查询2" ...   -> .probe/C12-wpsearch.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const out: string[] = []
for (const q of process.argv.slice(2)) {
  const u = new URL('https://zh.wikipedia.org/w/api.php')
  for (const [k, v] of Object.entries({ action: 'query', list: 'search', srsearch: q, srlimit: '5', format: 'json', variant: 'zh-cn' })) u.searchParams.set(k, v)
  await new Promise((ok) => setTimeout(ok, 1500))
  const body = await (await fetch(u, { headers: { 'User-Agent': 'new-era-research/0.1 (C12 batch)' } })).text()
  out.push(`## ${q}`)
  if (!body.startsWith('{')) {
    out.push('  (rate limited)')
    continue
  }
  const r = JSON.parse(body)
  // oxlint-disable-next-line typescript/no-explicit-any
  for (const h of (r.query?.search ?? []) as any[]) out.push(`  ${h.title} :: ${String(h.snippet).replace(/<[^>]+>/g, '')}`)
}
writeFileSync(join(ROOT, '.probe', 'C12-wpsearch.txt'), out.join('\n') + '\n')
console.log(out.length)

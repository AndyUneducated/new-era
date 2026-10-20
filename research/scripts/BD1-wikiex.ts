// BD1: intro extracts of named zh.wikipedia pages, or a full-text search
//   node research/scripts/BD1-wikiex.ts 标题1 标题2 ...      -> .probe/bd1-wikiex.txt
//   node research/scripts/BD1-wikiex.ts --search 关键词 ...  (each argument one search)
import { writeFileSync } from 'node:fs'
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
async function api(p: Record<string, string>) {
  const u = new URL('https://zh.wikipedia.org/w/api.php')
  for (const [k, v] of Object.entries({ format: 'json', variant: 'zh-cn', ...p })) u.searchParams.set(k, v)
  const r = await fetch(u, { headers: { 'User-Agent': UA } })
  return r.json()
}
const args = process.argv.slice(2)
const out: string[] = []
if (args[0] === '--search') {
  for (const q of args.slice(1)) {
    const r = await api({ action: 'query', list: 'search', srsearch: q, srlimit: '5' })
    out.push(`## ${q}`)
    for (const s of r.query?.search ?? []) out.push(`   ${s.title}\t${String(s.snippet).replace(/<[^>]+>/g, '').slice(0, 150)}`)
  }
} else {
  for (let i = 0; i < args.length; i += 20) {
    const r = await api({ action: 'query', prop: 'extracts', explaintext: '1', exintro: '1', redirects: '1', converttitles: '1', titles: args.slice(i, i + 20).join('|') })
    for (const pg of Object.values(r.query?.pages ?? {}) as any[]) out.push(`## ${pg.title}${pg.missing !== undefined ? ' MISSING' : ''}\n${(pg.extract ?? '').replace(/\s+/g, ' ').slice(0, 400)}`)
  }
}
writeFileSync('.probe/bd1-wikiex.txt', out.join('\n') + '\n', 'utf8')

// Research aid for research/falls-list/A02.yaml: searches zh/en Wikipedia for the army fall lists and dumps
// their wikitext.
//   node research/scripts/A02-wiki.ts search <query...>   -> .probe/A02-search.txt
//   node research/scripts/A02-wiki.ts page <lang> <title>  -> .probe/A02-wiki-<slug>.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const api = async (lang: string, params: Record<string, string>) => {
  const u = new URL(`https://${lang}.wikipedia.org/w/api.php`)
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) u.searchParams.set(k, v)
  return (await fetch(u, { headers: { 'User-Agent': UA } })).json()
}
const [mode, ...rest] = process.argv.slice(2)
if (mode === 'search') {
  const out: string[] = []
  for (const q of rest) {
    for (const lang of ['zh', 'en']) {
      const r = await api(lang, { action: 'query', list: 'search', srsearch: q, srlimit: '15' })
      out.push(`=== ${lang} ${q}`, ...(r.query?.search ?? []).map((s: { title: string; size: number }) => `${s.title}\t${s.size}`))
    }
  }
  writeFileSync(join(ROOT, '.probe', 'A02-search.txt'), out.join('\n') + '\n')
} else {
  const [lang, ...t] = rest
  const page = t.join(' ')
  const params: Record<string, string> = { action: 'parse', page, prop: 'wikitext', redirects: '1' }
  if (lang === 'zh') params.variant = 'zh-cn'
  const r = await api(lang, params)
  const text: string = r.parse?.wikitext ?? JSON.stringify(r.error ?? r)
  const slug = page.replace(/[^\w\u4e00-\u9fff]+/g, '-').slice(0, 40)
  writeFileSync(join(ROOT, '.probe', `A02-wiki-${slug}.txt`), `=== ${lang} ${page}\n${text}`)
  console.log(slug, text.length)
}

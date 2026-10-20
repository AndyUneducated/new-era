// C16 discovery: DuckDuckGo (html) result titles/snippets for "<name> <keyword>" per pending person (leads only, never cited).
// node research/scripts/C16-search.ts [--q=受贿 判处] id ...  ->  .probe/c16-search.txt (appends)
import { appendFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const args = process.argv.slice(2)
const kw = args.find((a) => a.startsWith('--q='))?.slice(4) ?? '受贿 判处'
const ids = new Set(args.filter((a) => !a.startsWith('--')))
const list = readFileSync(join(ROOT, 'research/lists/R17-pending-cases.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => l.split('\t'))
const strip = (s: string) =>
  s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()

const before = args.find((a) => a.startsWith('--before='))?.slice(9)
for (const [id, name, , sys, , last, blurb] of list) {
  if (before ? sys === 'army' || sys === 'other' || last >= before : !ids.has(id)) continue
  const q = `${name} ${kw}`
  let out = `## ${id} ${name} | ${blurb} | q=${q}\n`
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=cn-zh`, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(30000) })
    const html = await res.text()
    const blocks = html.split(/<div class="result results_links/).slice(1)
    for (const b of blocks) {
      let url = b.match(/class="result__a"[^>]*href="([^"]+)"/)?.[1] ?? ''
      const u = url.match(/uddg=([^&]+)/)?.[1]
      if (u) url = decodeURIComponent(u)
      const title = strip(b.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '')
      const snip = strip(b.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '')
      if (!(title + snip).includes(name)) continue
      out += `  - ${title}\n    ${url}\n    ${snip.slice(0, 300)}\n`
    }
    if (!blocks.length) out += `  (no results, status ${res.status}, ${html.length} bytes)\n`
  } catch (err) {
    out += `  FAIL ${(err as Error).message}\n`
  }
  appendFileSync(join(ROOT, '.probe/c16-search.txt'), out + '\n', 'utf8')
  await new Promise((r) => setTimeout(r, 2500))
}

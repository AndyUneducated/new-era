// Baidu Baike via the mobile site (no captcha): for each name (optionally name/lemmaId) lists the entries that share
// the name and the lead image of the entry shown. Writes .probe/PH8-wap.txt.
//   node research/scripts/PH8-wap.ts 王文全 王文全/12345 王文全~军|将 …   (~regex keeps only matching same-name entries)
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const out = '.probe/PH8-wap.txt'
writeFileSync(out, '')
for (const arg of args.filter((a) => !a.startsWith('--'))) {
  const [key, kw] = arg.split('~')
  const keep = kw ? new RegExp(kw) : null
  const [name, lemma] = key.split('/')
  const url = `https://wapbaike.baidu.com/item/${encodeURIComponent(name)}${lemma ? `/${lemma}` : ''}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!m) {
      appendFileSync(out, `== ${key}\nstatus ${res.status} no data (${/验证/.test(html) ? 'captcha' : html.length})\n\n`)
      continue
    }
    const s = JSON.stringify(JSON.parse(m[1]))
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.slice(0, 300) ?? ''
    const pics = [...new Set([...s.matchAll(/bkimg\.cdn\.bcebos\.com\/pic\/(\w+)/g)].map((x) => x[1]))].slice(0, 8)
    const poly = [...s.matchAll(/"lemmaId":(\d+),"lemmaTitle":"[^"]*","lemmaDesc":"([^"]*)"/g)].filter((x) => !keep || keep.test(x[2])).map((x) => `  ${x[1]} ${x[2]}`)
    appendFileSync(out, `== ${key}\nfinal ${res.url}\ndesc ${desc}\npics ${pics.join(' ')}\n${lemma ? '' : [...new Set(poly)].join('\n')}\n\n`)
  } catch (e) {
    appendFileSync(out, `== ${key}\nERR ${(e as Error).message}\n\n`)
  }
  await new Promise((r) => setTimeout(r, 700))
}
console.log('done')

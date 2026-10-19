// Baidu Baike via the mobile site (no captcha): for each name (optionally name/lemmaId) lists the entries that share
// the name and the lead image of the entry shown. Writes .probe/PH4-wap.txt (and the raw page data of the last
// one to .probe/PH4-wap.json with --dump).
//   node research/scripts/PH4-wap.ts 王文全 王文全/12345 …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const dump = args.includes('--dump')
const out = '.probe/PH4-wap.txt'
writeFileSync(out, '')
for (const key of args.filter((a) => !a.startsWith('--'))) {
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
    const data = JSON.parse(m[1])
    if (dump) writeFileSync('.probe/PH4-wap.json', JSON.stringify(data, null, 1))
    const s = JSON.stringify(data)
    const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.slice(0, lemma ? 260 : 150) ?? ''
    const pics = [...new Set([...s.matchAll(/bkimg\.cdn\.bcebos\.com\/pic\/(\w+)/g)].map((x) => x[1]))].slice(0, 8)
    const sizes = [...s.matchAll(/"src":"(\w{20,})","width":(\d+),"height":(\d+)/g)].slice(0, 4).map((x) => `${x[1]} ${x[2]}x${x[3]}`)
    const poly = [...s.matchAll(/"lemmaId":(\d+),"lemmaTitle":"[^"]*","lemmaDesc":"([^"]*)"/g)].map((x) => `  ${x[1]} ${x[2]}`)
    appendFileSync(out, `== ${key}\nfinal ${res.url}\ndesc ${desc}\npics ${pics.join(' ')}\nsizes ${sizes.join(' | ')}\n${lemma ? '' : [...new Set(poly)].join('\n')}\n\n`)
  } catch (e) {
    appendFileSync(out, `== ${key}\nERR ${(e as Error).message}\n\n`)
  }
  await new Promise((r) => setTimeout(r, 700))
}
console.log('done')

// Searches a news site's own search page for each person and writes the article links found to a PH12-bing-style
// file (.probe/PH12-bing-<out>.txt: "== name (status)" then "TAB page" lines), so that PH12-auto.ts can scan them.
//   node research/scripts/PH12-site.ts --site=voa|rfa|dw --file=<id TAB name file> --out=x [--n=8]
import { readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const opt = (k: string) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3)
const site = opt('site') ?? 'voa'
const n = Number(opt('n') ?? 8)
const SITES: Record<string, { search: (q: string) => string; link: RegExp; base: string }> = {
  voa: { search: (q) => `https://www.voachinese.com/s?k=${encodeURIComponent(q)}`, link: /href="(\/a\/[^"#?]+\.html)"/g, base: 'https://www.voachinese.com' },
  rfa: { search: (q) => `https://www.rfa.org/mandarin/search?q=${encodeURIComponent(q)}`, link: /href="(https:\/\/www\.rfa\.org\/mandarin\/[^"#?]+)"/g, base: '' },
  dw: { search: (q) => `https://www.dw.com/search/zh?languageCode=zh&item=${encodeURIComponent(q)}`, link: /href="(\/zh\/[^"#?]+\/a-\d+)"/g, base: 'https://www.dw.com' },
}
const s = SITES[site]
const rows = readFileSync(opt('file')!, 'utf8').split('\n').filter((l) => l.includes('\t'))
let out = ''
for (const r of rows) {
  const q = r.split('\t')[1].trim()
  try {
    const res = await fetch(s.search(q), { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(20000) })
    const html = await res.text()
    const links = [...new Set([...html.matchAll(s.link)].map((m) => s.base + m[1]))].slice(0, n)
    out += `== ${q} (${res.status})\n` + links.map((l) => `\t${l}\n`).join('')
  } catch (e) {
    out += `== ${q} (ERR ${(e as Error).message})\n`
  }
}
writeFileSync(`.probe/PH12-bing-${opt('out') ?? site}.txt`, out)
console.log('done')

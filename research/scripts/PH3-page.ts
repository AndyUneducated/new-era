// Fetches Baidu Baike pages and pulls out the title, description and lead image, for names whose default entry
// is someone else. Writes .probe/PH3-page.txt.
//   node research/scripts/PH3-page.ts <url> …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const out = '.probe/PH3-page.txt'
writeFileSync(out, '')
for (const url of process.argv.slice(2)) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, redirect: 'follow' })
    const html = await res.text()
    const pick = (re: RegExp) => html.match(re)?.[1] ?? ''
    const title = pick(/<title>([^<]*)<\/title>/)
    const desc = pick(/<meta name="description" content="([^"]*)"/).slice(0, 200)
    const img = pick(/<meta property="og:image" content="([^"]*)"/) || pick(/"(https:\/\/bkimg\.cdn\.bcebos\.com\/pic\/\w+)/)
    const lemmas = [...new Set([...html.matchAll(/\/item\/[^"/]+\/(\d+)[^"]*"[^>]*>([^<]{2,40})</g)].map((m) => `${m[1]} ${m[2]}`))].slice(0, 40)
    appendFileSync(out, `== ${url}\nstatus ${res.status} final ${res.url} len ${html.length}\ntitle ${title}\ndesc ${desc}\nimg ${img}\n${/captcha|验证/.test(html) ? 'CAPTCHA?\n' : ''}${lemmas.join('\n')}\n\n`)
  } catch (e) {
    appendFileSync(out, `== ${url}\nERR ${(e as Error).message}\n\n`)
  }
  await new Promise((r) => setTimeout(r, 800))
}
console.log('done')

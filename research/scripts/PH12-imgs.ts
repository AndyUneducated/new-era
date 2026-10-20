// Lists the pictures on news or official pages, with the caption text around each, for finding a portrait of a
// named person: writes .probe/PH12-imgs.txt (page title, then one line per <img>: absolute src, alt, and the text
// just after the picture). Decodes GBK pages. With --grep=<text> only pictures whose caption or alt contains it.
//   node research/scripts/PH12-imgs.ts [--grep=刘汉] <page url>[@@<name>] …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const grep = args.find((a) => a.startsWith('--grep='))?.slice(7)
const out = '.probe/PH12-imgs.txt'
writeFileSync(out, '')
const ent = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
const text = (h: string) =>
  ent(h)
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
for (const arg of args.filter((a) => !a.startsWith('--'))) {
  // url@@name: only pictures whose alt or caption mentions this name (overrides --grep)
  const [url, own] = arg.split('@@')
  const want = own ?? grep
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' } })
    const buf = Buffer.from(await res.arrayBuffer())
    const head = buf.subarray(0, 3000).toString('latin1')
    const cs = (res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? head.match(/charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
    const html = new TextDecoder(/gb/.test(cs) ? 'gbk' : cs).decode(buf)
    const title = text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    appendFileSync(out, `== ${url}\n${res.status} ${title}\n`)
    const re = /<img\b[^>]*>/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      const tag = m[0]
      const src = tag.match(/\b(?:data-original|data-src|src)=["']([^"']+)["']/i)?.[1]
      if (!src || /^data:|\.gif(\?|$)|\.svg(\?|$)|logo|icon|qrcode|erweima|share/i.test(src)) continue
      const alt = ent(tag.match(/\balt=["']([^"']*)["']/i)?.[1] ?? '')
      const after = text(html.slice(m.index + tag.length, m.index + tag.length + 1200)).slice(0, 160)
      if (want && !alt.includes(want) && !after.includes(want)) continue
      let abs = src
      try {
        abs = new URL(src, url).href
      } catch {}
      appendFileSync(out, `${abs}\t${alt}\t${after}\n`)
    }
    appendFileSync(out, '\n')
  } catch (e) {
    appendFileSync(out, `== ${url}\nERR ${(e as Error).message}\n\n`)
  }
}
console.log('done')

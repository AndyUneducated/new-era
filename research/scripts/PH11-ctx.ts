// Caption check: for each "page url@@fragment" prints the page text just before and after where the picture
// (any part of its file name) appears in the HTML, tags stripped, to .probe/PH11-ctx.txt. Decodes GBK pages.
//   node research/scripts/PH11-ctx.ts [--w=400] "<page url>@@<image file name fragment>" …
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const w = Number(args.find((a) => a.startsWith('--w='))?.slice(4) ?? 400)
const out = '.probe/PH11-ctx.txt'
writeFileSync(out, '')
const text = (h: string) =>
  h
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img\b[^>]*>/gi, ' [IMG] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/\s+/g, ' ')
    .trim()
for (const arg of args.filter((a) => !a.startsWith('--'))) {
  const [url, frag] = arg.split('@@')
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(20000) })
    const buf = Buffer.from(await res.arrayBuffer())
    const head = buf.subarray(0, 3000).toString('latin1')
    const cs = (res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? head.match(/charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
    const html = new TextDecoder(/gb/.test(cs) ? 'gbk' : cs).decode(buf)
    const title = text(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
    appendFileSync(out, `== ${url} @@ ${frag}\n${res.status} ${title}\n`)
    let i = html.indexOf(frag)
    let n = 0
    while (i >= 0 && n < 3) {
      const tagStart = html.lastIndexOf('<', i)
      const tagEnd = html.indexOf('>', i)
      appendFileSync(out, `  BEFORE: ${text(html.slice(Math.max(0, tagStart - w * 3), tagStart)).slice(-w)}\n  AFTER: ${text(html.slice(tagEnd + 1, tagEnd + 1 + w * 4)).slice(0, w)}\n`)
      i = html.indexOf(frag, i + frag.length)
      n++
    }
    if (n === 0) appendFileSync(out, '  (fragment not found)\n')
    appendFileSync(out, '\n')
  } catch (e) {
    appendFileSync(out, `== ${url}\nERR ${(e as Error).message}\n\n`)
  }
}
console.log('done')

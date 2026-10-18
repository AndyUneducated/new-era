// R03 one-off: try URLs and report status, final URL and a text snippet, to pick fetchable copies before registering.
//   node research/scripts/R03-try.ts url1 url2 ...   -> .probe/R03-try.txt
import { appendFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const out = '.probe/R03-try.txt'
writeFileSync(out, '')
await Promise.all(
  process.argv.slice(2).map(async (u) => {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(40_000) })
      const buf = new Uint8Array(await r.arrayBuffer())
      const head = new TextDecoder('latin1').decode(buf.slice(0, 8192))
      const cs = (head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
      const t = new TextDecoder(cs === 'gb2312' ? 'gbk' : cs).decode(buf)
      const title = t.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ''
      const body = t.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
      const k = body.indexOf('经查')
      appendFileSync(out, `${r.status} ${u}\n  -> ${r.url}\n  title: ${title}\n  ${k >= 0 ? body.slice(k, k + 120) : body.slice(0, 120)}\n`)
    } catch (e) {
      appendFileSync(out, `ERR ${u} ${(e as Error).message}\n`)
    }
  }),
)
console.log('done')

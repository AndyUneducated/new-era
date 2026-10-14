// K04: try candidate URLs for a source; print status, length, and whether the subject's name is in the page.
//   node research/scripts/K04-probe.ts 名字 url1 url2 ...
import { writeFileSync, appendFileSync } from 'node:fs'
const [who, ...urls] = process.argv.slice(2)
const out = '.probe/K04-probe.txt'
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36' }, redirect: 'follow', signal: AbortSignal.timeout(40000) })
    const buf = new Uint8Array(await r.arrayBuffer())
    const head = new TextDecoder('latin1').decode(buf.slice(0, 2000))
    const cs = (head.match(/charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
    const html = new TextDecoder(cs === 'gb2312' ? 'gbk' : cs).decode(buf)
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
    const k = text.indexOf(who)
    appendFileSync(out, `${r.status} ${buf.length}B hit=${k >= 0} ${r.url}\n  ${k >= 0 ? text.slice(Math.max(0, k - 60), k + 200) : text.slice(0, 200)}\n`)
  } catch (e) {
    appendFileSync(out, `ERR ${(e as Error).message} ${u}\n`)
  }
}
if (!urls.length) writeFileSync(out, '')

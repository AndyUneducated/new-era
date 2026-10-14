// D01 one-off: fetch candidate pages and dump their text and links to .probe/D01-probe-<n>.txt, to find the charter/constitution pages.
// Usage: node research/scripts/D01-probe.ts url1 url2 ...
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
mkdirSync(join(ROOT, '.probe'), { recursive: true })

const urls = process.argv.slice(2)
const summary: string[] = []
for (const [n, url] of urls.entries()) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(45_000) })
    const buf = new Uint8Array(await res.arrayBuffer())
    const head = new TextDecoder('latin1').decode(buf.slice(0, 8192))
    const meta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
    const cs = (meta ?? res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
    const html = new TextDecoder(cs === 'gb2312' ? 'gbk' : cs).decode(buf)
    const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => `${m[2].replace(/<[^>]+>/g, '').trim()}  ${m[1]}`)
    const text = html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h\d|li|tr|td)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n')
    writeFileSync(join(ROOT, '.probe', `D01-probe-${n}.txt`), `${url}\nstatus ${res.status} charset ${cs}\n\n=== LINKS\n${links.join('\n')}\n\n=== TEXT\n${text}\n`)
    summary.push(`${n} ${res.status} ${text.length} ${url}`)
  } catch (err) {
    summary.push(`${n} FAIL ${(err as Error).message} ${url}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'D01-probe.txt'), summary.join('\n') + '\n')

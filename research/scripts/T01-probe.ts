// T01 one-off: fetch a page (or a Wayback CDX query) and dump a rough text to .probe/T01-probe-<n>.txt,
// to find notice URLs and titles before registering them. Usage: node research/scripts/T01-probe.ts <name> <url> [--links]
import { writeFileSync } from 'node:fs'

const [name, url] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const links = process.argv.includes('--links')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(90_000) })
const buf = new Uint8Array(await res.arrayBuffer())
const head = new TextDecoder('latin1').decode(buf.slice(0, 8192))
const meta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
const cs = (meta ?? res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
const html = new TextDecoder(cs === 'gb2312' ? 'gbk' : cs).decode(buf)
let out: string
if (links) {
  out = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, h, t]) => `${t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()}\t${h}`)
    .filter((l) => /[\u4e00-\u9fff]/.test(l))
    .join('\n')
  // list pages print the date next to the link
  out += '\n\n---\n' + html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/[ \t\r]+/g, ' ').replace(/\n\s*\n+/g, '\n')
} else {
  out = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ').replace(/[ \t\r]+/g, ' ').replace(/\n\s*\n+/g, '\n')
}
writeFileSync(`.probe/T01-probe-${name}.txt`, `${res.status} ${url}\n${out}`, 'utf8')
console.log(res.status, out.length)

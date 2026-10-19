// R07 one-off: which URL forms answer with the real page (CCDI direct, Wayback id_, Xinhua). Output: .probe/R07-try.txt
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const urls = process.argv.slice(2)
const out: string[] = []
for (const u of urls) {
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(40_000) })
    const t = new TextDecoder('utf-8').decode(await r.arrayBuffer())
    const title = t.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ''
    out.push(`${r.status} ${t.length} ${r.url}\n   ${title.slice(0, 120)}`)
    if (t.length < 5000) out.push(t)
    else out.push(t.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').slice(0, 1500))
  } catch (e) {
    out.push(`FAIL ${u} ${(e as Error).message}`)
  }
}
writeFileSync('.probe/R07-try.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

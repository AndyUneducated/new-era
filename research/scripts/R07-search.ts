// R07 finding aid: web search results (title + URL only, official hosts only) for notice titles, so official
// reprints can be picked without reading whole pages.
//   node research/scripts/R07-search.ts "query" ...   -> .probe/R07-search.txt
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const dec = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .trim()
// Bing wraps results in /ck/a?...&u=a1<base64url>
const unbing = (u: string) => {
  const m = u.match(/[?&]u=a1([^&]+)/)
  return m ? Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8') : u
}
const OFF = /news\.cn|xinhuanet|court\.gov\.cn|people\.com\.cn|people\.cn|cctv|ccdi\.gov\.cn|youth\.cn|hebcdi|chinacourt/
const engine = process.env.ENGINE ?? 'bing'
const out: string[] = []
for (const q of process.argv.slice(2)) {
  out.push(`## ${q}`)
  await new Promise((r) => setTimeout(r, 1200))
  const u =
    engine === 'sogou'
      ? `https://www.sogou.com/web?query=${encodeURIComponent(q)}`
      : engine === 'so'
        ? `https://www.so.com/s?q=${encodeURIComponent(q)}`
        : `https://cn.bing.com/search?q=${encodeURIComponent(q)}&ensearch=0&count=30`
  try {
    const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(30_000) })
    const h = await r.text()
    const hits = [...h.matchAll(/<h[23][^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => [dec(m[2]), unbing(dec(m[1]))] as const)
    out.push(`  [${engine} ${r.status} ${h.length} ${hits.length}]`)
    for (const [t, l] of hits.filter(([, l]) => OFF.test(l)).slice(0, 8)) out.push(`  ${t}\n      ${l}`)
    if (!hits.length) out.push('  ' + dec(h.replace(/<(script|style)[\s\S]*?<\/\1>/g, '')).replace(/\s+/g, ' ').slice(0, 300))
  } catch (e) {
    out.push(`  FAIL ${(e as Error).message}`)
  }
}
writeFileSync('.probe/R07-search.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

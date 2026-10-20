// For every search block of a PH12-bing result file, opens the lead pages and keeps the pictures whose caption (the
// alt text or the first 60 characters after the picture) names the person, i.e. the first word of the search. Writes
// .probe/PH12-auto[-tag].txt: "id TAB img TAB page TAB caption", one line per picture, grouped by person.
//   node research/scripts/PH12-auto.ts <bing file> <id TAB query file> [--tag=x] [--n=10] [block numbers…]
import { readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const [src, qfile] = args.filter((a) => !a.startsWith('--'))
const only = args.filter((a) => /^\d+$/.test(a)).map(Number)
const tag = args.find((a) => a.startsWith('--tag='))?.slice(6)
const n = Number(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 10)
const ids = readFileSync(qfile, 'utf8').split('\n').filter((l) => l.includes('\t')).map((l) => l.split('\t')[0])
const blocks: { name: string; pages: string[] }[] = []
for (const l of readFileSync(src, 'utf8').split('\n')) {
  if (l.startsWith('== ')) blocks.push({ name: l.slice(3).split(' ')[0], pages: [] })
  else if (l.includes('\t')) blocks.at(-1)!.pages.push(l.split('\t')[1])
}
const ent = (h: string) =>
  h.replace(/&#x([0-9a-f]+);/gi, (_, x) => String.fromCodePoint(parseInt(x, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
const text = (h: string) =>
  ent(h)
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
async function scan(page: string, name: string) {
  const res = await fetch(page, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(15000) })
  const buf = Buffer.from(await res.arrayBuffer())
  const head = buf.subarray(0, 3000).toString('latin1')
  const cs = (res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? head.match(/charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
  const html = new TextDecoder(/gb/.test(cs) ? 'gbk' : cs).decode(buf)
  const found: string[] = []
  const re = /<img\b[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const t = m[0]
    const s = t.match(/\b(?:data-original|data-src|src)=["']([^"']+)["']/i)?.[1]
    if (!s || /^data:|\.gif(\?|$)|\.svg(\?|$)|logo|icon|qrcode|erweima|share/i.test(s)) continue
    const alt = ent(t.match(/\balt=["']([^"']*)["']/i)?.[1] ?? '')
    const after = text(html.slice(m.index + t.length, m.index + t.length + 600)).slice(0, 60)
    if (!alt.includes(name) && !after.includes(name)) continue
    let abs = s
    try {
      abs = new URL(s, page).href
    } catch {}
    found.push(`${abs}\t${page}\t${(alt + ' | ' + after).replace(/\t/g, ' ')}`)
  }
  return found
}
const lines: string[] = []
const jobs: (() => Promise<void>)[] = []
blocks.forEach((b, i) => {
  if (only.length && !only.includes(i + 1)) return
  for (const p of [...new Set(b.pages.slice(0, n))])
    jobs.push(async () => {
      try {
        for (const f of await scan(p, b.name)) lines.push(`${ids[i]}\t${f}`)
      } catch {}
    })
})
let next = 0
await Promise.all(Array.from({ length: 10 }, async () => {
  while (next < jobs.length) await jobs[next++]()
}))
lines.sort((a, b) => ids.indexOf(a.split('\t')[0]) - ids.indexOf(b.split('\t')[0]))
const seen = new Set<string>()
const out = lines.filter((l) => {
  const k = l.split('\t')[1]
  return !seen.has(k) && seen.add(k)
})
writeFileSync(`.probe/PH12-auto${tag ? '-' + tag : ''}.txt`, out.join('\n') + '\n')
console.log(`${out.length} pictures, ${new Set(out.map((l) => l.split('\t')[0])).size} people`)

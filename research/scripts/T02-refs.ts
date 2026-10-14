// T02: for each name, pull the zh.wikipedia page (zh-cn) and list its intro line and external reference links,
// to locate Xinhua / People's Daily / court reprints of the CCDI notices. Discovery only; nothing here is cited.
// Usage: node research/scripts/T02-refs.ts <out-name> 名字[=页面标题] ...   → .probe/T02-refs-<out-name>.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', '..')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const [out, ...names] = process.argv.slice(2)
const KEEP = /(news\.cn|xinhuanet|people\.com\.cn|people\.cn|chinanews|gov\.cn|court|chinapeace|thepaper|caixin|bjnews|ccdi|spp\.gov|81\.cn|mod\.gov|npc\.gov|cctv|chinadaily|bbc|rfa|voachinese|dw\.com|zaobao|cna\.com|reuters|nytimes)/

const lines: string[] = []
for (const arg of names) {
  const [name, given = name] = arg.split('=')
  await sleep(1500)
  try {
    let title = given
    // 名字=?关键词: search zh.wikipedia for "名字 关键词" and take the first hit (for disambiguation pages)
    if (given.startsWith('?')) {
      const q = new URL('https://zh.wikipedia.org/w/api.php')
      for (const [k, v] of Object.entries({ action: 'query', list: 'search', srsearch: `${name} ${given.slice(1)}`, format: 'json', srlimit: '1' })) q.searchParams.set(k, v)
      const hit = (await (await fetch(q, { headers: { 'User-Agent': UA } })).json()) as { query?: { search?: { title: string }[] } }
      title = hit.query?.search?.[0]?.title ?? name
      await sleep(1000)
    }
    const res = await fetch(`https://zh.wikipedia.org/zh-cn/${encodeURIComponent(title)}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'zh-cn' },
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      lines.push(`## ${name}\t${res.status}`)
      continue
    }
    const html = await res.text()
    const body = html.slice(html.indexOf('mw-parser-output'))
    const intro = (/<p>([\s\S]*?)<\/p>/.exec(body)?.[1] ?? '').replace(/<[^>]+>/g, '').slice(0, 220)
    lines.push(`## ${name}\t[${title}] ${intro}`)
    const seen = new Set<string>()
    const re = /<a([^>]*)>([\s\S]*?)<\/a>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      if (!/class="external/.test(m[1])) continue
      const href = (/href="([^"]+)"/.exec(m[1])?.[1] ?? '').replace(/&amp;/g, '&')
      if (!KEEP.test(href) || seen.has(href)) continue
      seen.add(href)
      lines.push(`  ${m[2].replace(/<[^>]+>/g, '').trim().slice(0, 80)}\t${href}`)
    }
  } catch (err) {
    lines.push(`## ${name}\tERR ${(err as Error).message}`)
  }
}
writeFileSync(join(root, `.probe/T02-refs-${out}.txt`), lines.join('\n'), 'utf8')
console.log(lines.length)

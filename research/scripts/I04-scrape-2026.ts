// I04: every article of 人民日报 from 2026-01-01 to 2026-10-13, read from the official electronic edition
// (paper.people.com.cn, layout of December 2024 onward), in the shape of the Papersnake/people_daily_news
// records ({ date: 'YYYY.MM.DD', title, page, text, url }), so that I04-count.ts treats 2026 like the earlier years.
//   node research/scripts/I04-scrape-2026.ts [from=2026-01-01] [to=2026-10-13]
// One file per day in .probe/i04-rmrb/2026/<YYYYMMDD>.jsonl; days already written are skipped, so it can resume.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const OUT = join(ROOT, '.probe', 'i04-rmrb', '2026')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const BASE = 'https://paper.people.com.cn/rmrb/pc'
const [from = '2026-01-01', to = '2026-10-13'] = process.argv.slice(2)
mkdirSync(OUT, { recursive: true })

async function get(url: string): Promise<string | undefined> {
  for (let tries = 0; tries < 4; tries++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30_000) })
      if (res.status === 404) return undefined
      if (res.ok) return await res.text()
    } catch {}
    await new Promise((r) => setTimeout(r, 2000 * (tries + 1)))
  }
  throw new Error(`failed ${url}`)
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&middot;/g, '·')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&')
const strip = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/[ \t\u00a0]+/g, ' ').trim()

function article(html: string) {
  const body = html.match(/<div id="ozoom">([\s\S]*?)<!--\/enpcontent-->/)?.[1] ?? ''
  const text = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1])).filter(Boolean).join('\n')
  const prop = (k: string) => strip(html.match(new RegExp(`<${k}>([\\s\\S]*?)</${k}>`))?.[1] ?? '')
  const title = [prop('introtitle'), prop('title'), prop('subtitle')].filter(Boolean).join('\n')
  return { title, text }
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) await fn(items[i++])
  }))
}

async function day(d: Date) {
  const ym = d.toISOString().slice(0, 7).replace('-', '')
  const dd = d.toISOString().slice(8, 10)
  const ymd = `${ym}${dd}`
  const file = join(OUT, `${ymd}.jsonl`)
  if (existsSync(file)) return
  const first = await get(`${BASE}/layout/${ym}/${dd}/node_01.html`)
  if (!first) return console.log(`${ymd} no issue`)
  const pages = [...new Set([...first.matchAll(/href="(node_\d+\.html)"/g)].map((m) => m[1]))]
  const items: { url: string; page: string }[] = []
  for (const p of pages) {
    const html = p === 'node_01.html' ? first : await get(`${BASE}/layout/${ym}/${dd}/${p}`)
    if (!html) continue
    const page = String(Number(p.match(/\d+/)![0]))
    for (const m of html.matchAll(/href="\.\.\/\.\.\/\.\.\/content\/\d{6}\/\d{2}\/(content_\d+\.html)"/g)) {
      const url = `${BASE}/content/${ym}/${dd}/${m[1]}`
      if (!items.some((x) => x.url === url)) items.push({ url, page })
    }
  }
  const rows: string[] = []
  await pool(items, 4, async ({ url, page }) => {
    const html = await get(url)
    if (!html) return
    const { title, text } = article(html)
    rows.push(JSON.stringify({ date: `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6)}`, title, page, text, url }))
  })
  writeFileSync(file, rows.join('\n') + '\n')
  console.log(`${ymd} pages ${pages.length} articles ${rows.length}`)
}

const days: Date[] = []
for (let d = new Date(`${from}T00:00:00Z`); d <= new Date(`${to}T00:00:00Z`); d = new Date(d.getTime() + 86_400_000)) days.push(d)
await pool(days, 3, async (d) => {
  try {
    await day(d)
  } catch (err) {
    console.log(`${d.toISOString().slice(0, 10)} ERROR ${(err as Error).message}`)
  }
})

// Finds Wayback snapshots of CCDI notices (the site itself answers scripts with a captcha), works out the
// start/end markers of the notice body, and writes manifest entries for research/manifests/R01.yaml.
//   node research/scripts/R01-notices.ts <list.json>   -> .probe/R01-notices.yaml + .probe/R01-notices-log.txt
// list.json: [{ id, title, date, urls: [candidate original urls, best first] }]
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
type Item = { id: string; title: string; date: string; urls: string[]; publisher?: string }
const items: Item[] = JSON.parse(readFileSync(process.argv[2], 'utf8'))

// same extraction as tools/fetch-web.ts, so the markers found here match there
function decode(s: string): string {
  const named: Record<string, string> = {
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', mdash: '—', ndash: '–', hellip: '…', middot: '·', copy: '©', quot: '"', amp: '&', lt: '<', gt: '>', nbsp: ' ', apos: "'",
  }
  return s
    .replace(/&([a-z]+);/g, (m, n: string) => named[n] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
}
function htmlToText(html: string): string {
  return decode(
    html
      .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article|figcaption|td)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .split('\n')
    .map((l) => l.replace(/[ \t\u3000\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}
async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(45_000) })
  if (!res.ok) throw new Error(`${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())
  const head = new TextDecoder('latin1').decode(buf.slice(0, 8192))
  const meta = head.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
  const charset = (meta ?? res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
  return new TextDecoder(charset === 'gb2312' ? 'gbk' : charset).decode(buf)
}
async function snapshot(url: string): Promise<string | null> {
  if (url.includes('web.archive.org')) return url
  try {
    const r = await (await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=20170101`, { signal: AbortSignal.timeout(30_000) })).json()
    const s = r?.archived_snapshots?.closest
    if (!s?.available) return null
    return `https://web.archive.org/web/${s.timestamp}id_/${url}`
  } catch {
    return null
  }
}
const BODY = /^(日前|近日|经查|中共中央纪委|中央纪委|经中共中央|中共中央|据中央纪委|\d{4}年\d{1,2}月|新华社|本网讯|中央纪委监察部网站讯|记者从)/
const yamlQ = (s: string) => (/[:#'"{}\[\],&*?|<>=!%@`]/.test(s) || /^\d/.test(s) ? `'${s.replace(/'/g, "''")}'` : s)
const out: string[] = []
const log: string[] = []
for (const it of items) {
  let done = false
  for (const u of it.urls) {
    const snap = await snapshot(u)
    if (!snap) {
      log.push(`NOSNAP ${it.id} ${u}`)
      continue
    }
    let text: string
    try {
      text = htmlToText(await get(snap))
    } catch (e) {
      log.push(`FAIL ${it.id} ${snap} ${(e as Error).message}`)
      continue
    }
    const paras = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    const stop = paras.findIndex((p) => p.startsWith('©') || /^(【|责任编辑|打印|关闭|相关新闻)/.test(p))
    const body = paras.slice(0, stop < 0 ? undefined : stop)
    let i = body.findIndex((p) => BODY.test(p) && p.length > 20)
    // one-line probe notices: the sentence after the share buttons
    if (i < 0) {
      const share = body.lastIndexOf('微信')
      if (share >= 0 && share + 1 < body.length && /。$/.test(body[share + 1])) i = share + 1
    }
    if (i < 0) {
      log.push(`NOBODY ${it.id} ${snap}`)
      writeFileSync(join(ROOT, `.probe/R01-nobody-${it.id}.txt`), text)
      continue
    }
    let j = body.length - 1
    while (j > i && !/[。”]$/.test(body[j])) j--
    let n = 18
    while (n < body[i].length && text.indexOf(body[i].slice(0, n)) !== text.indexOf(body[i])) n += 6
    const start = body[i].slice(0, n)
    const end = body[j].slice(-14)
    if (text.indexOf(start) !== text.indexOf(body[i])) log.push(`WARN start not first ${it.id}`)
    const kept = body.slice(i, j + 1).join('')
    log.push(`OK ${it.id} ${kept.length} chars ${snap}`)
    out.push(
      [
        `  - id: ${it.id}`,
        `    title: ${yamlQ(it.title)}`,
        `    publisher: ${it.publisher ?? '中央纪委监察部网站'}`,
        `    date: ${it.date}`,
        `    voice: official`,
        `    url: ${snap}`,
        `    start: ${yamlQ(start)}`,
        `    end: ${yamlQ(end)}`,
      ].join('\n'),
    )
    done = true
    break
  }
  if (!done) log.push(`MISSING ${it.id}`)
}
writeFileSync(join(ROOT, '.probe/R01-notices.yaml'), out.join('\n') + '\n')
writeFileSync(join(ROOT, '.probe/R01-notices-log.txt'), log.join('\n') + '\n')
console.log(`${out.length} of ${items.length}`)

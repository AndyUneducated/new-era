// K08 research aid (not a source fetch): pulls zh.wikipedia pages by title and writes the text plus the
// succession boxes (前任/继任 blocks) to .probe/K08-peek/<title>.txt and a summary to .probe/K08-peek.txt.
// Usage: node research/scripts/K08-peek.ts 韩志然 牛玉儒 ...   (titles may carry a disambiguation, e.g. 李刚_(1964年))
import { mkdirSync, writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const dir = join(ROOT, '.probe', 'K08-peek')
mkdirSync(dir, { recursive: true })
const listFile = process.argv.find((a) => a.startsWith('--file='))?.slice(7)
const titles = listFile
  ? readFileSync(listFile, 'utf8').split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean)
  : process.argv.slice(2).filter((a) => !a.startsWith('--'))
const sum = join(ROOT, '.probe', 'K08-peek.txt')
if (process.argv.includes('--fresh')) writeFileSync(sum, '')

function decode(s: string): string {
  const named: Record<string, string> = { ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', middot: '·', quot: '"', amp: '&', lt: '<', gt: '>', nbsp: ' ' }
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
    .filter(Boolean)
    .join('\n')
}
for (const t of titles) {
  const f = join(dir, `${t}.txt`)
  let text: string
  if (existsSync(f) && !process.argv.includes('--force')) text = readFileSync(f, 'utf8')
  else {
    try {
      const res = await fetch(`https://zh.wikipedia.org/zh-hans/${encodeURIComponent(t)}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN' }, signal: AbortSignal.timeout(40_000) })
      if (!res.ok) {
        appendFileSync(sum, `######## ${t} FAIL ${res.status}\n`)
        continue
      }
      text = htmlToText(await res.text())
    } catch (e) {
      appendFileSync(sum, `######## ${t} FAIL ${(e as Error).message}\n`)
      continue
    }
    writeFileSync(f, text)
    await new Promise((r) => setTimeout(r, 500))
  }
  const lines = text.split('\n')
  const out: string[] = [`######## ${t}`]
  const lead = lines.findIndex((l) => l.startsWith(t.replace(/_.*/, '')) && l.length > 30)
  if (lead >= 0) out.push(`  LEAD ${lines[lead].slice(0, 260)}`)
  const seen = new Set<string>()
  lines.forEach((l, i) => {
    if (!/^(前任|继任|前任：|继任：)$/.test(l)) return
    const ctx = lines.slice(i, i + 4).join(' | ')
    if (!seen.has(ctx)) (seen.add(ctx), out.push(`  ${ctx.slice(0, 160)}`))
  })
  for (const l of lines) if (/接替|接任|继任|搭档|提拔|栽培|老部下/.test(l) && l.length < 260 && !seen.has(l)) (seen.add(l), out.push(`   ~ ${l}`))
  appendFileSync(sum, out.join('\n') + '\n')
}
console.log('done', titles.length)

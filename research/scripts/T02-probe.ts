// T02: list the CCDI "审查调查 · 中管干部" pages (执纪审查 zjsc, 党纪政务处分 djcf) through Wayback to pick
// candidates and their article URLs. Writes .probe/T02-list-<col>-<stamp>.txt: date, title, url.
// Usage: node research/scripts/T02-probe.ts <zjsc|djcf> <wayback stamp, e.g. 2025> <first page> <last page>
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..', '..')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const [col = 'zjsc', stamp = '2025', from = '0', to = '3'] = process.argv.slice(2)

const rows: string[] = []
for (let p = Number(from); p <= Number(to); p++) {
  const orig = `https://www.ccdi.gov.cn/scdcn/zggb/${col}/index${p ? `_${p}` : ''}.html`
  const url = `https://web.archive.org/web/${stamp}id_/${orig}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000) })
    const html = await res.text()
    if (!res.ok) {
      rows.push(`# ${url} ${res.status}`)
      continue
    }
    let n = 0
    const re = /<li[^>]*>([\s\S]*?)<\/li>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      const a = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/.exec(m[1])
      const d = /(\d{4}-\d{2}-\d{2})/.exec(m[1])
      if (!a || !d) continue
      const title = a[2].replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim()
      if (title.length < 6) continue
      rows.push(`${d[1]}\t${title}\t${new URL(a[1], orig).href}`)
      n++
    }
    rows.push(`# ${url} ${n}`)
  } catch (err) {
    rows.push(`# ${url} ERR ${(err as Error).message}`)
  }
}
writeFileSync(join(root, `.probe/T02-list-${col}-${stamp}-${from}-${to}.txt`), rows.join('\n'), 'utf8')
console.log(rows.length)

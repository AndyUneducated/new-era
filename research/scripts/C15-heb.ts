// Parses the Hebei CDI mirror of the CCDI 中管干部 columns fetched by R06-peek.ts (c15hz-* 执纪审查, c15hd-* 党纪政务处分)
//   node research/scripts/C15-heb.ts -> .probe/C15-heb.txt (date, column, title, url), 2026 only
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const rows = new Map<string, string>()
for (const f of readdirSync('.probe').filter((f) => /^R06-peek-c15h[dz]-\d+\.txt$/.test(f))) {
  const col = f.includes('c15hd') ? 'djcf' : 'zjsc'
  const lines = readFileSync(`.probe/${f}`, 'utf8').split('\n').map((l) => l.trim())
  for (let i = 0; i + 1 < lines.length; i++) {
    const m = lines[i].match(/^\[(http:\/\/www\.hebcdi\.gov\.cn\/(20\d\d-\d\d)\/(\d\d)\/content_\d+\.htm)\]\s*(.+)$/)
    if (!m || !/^\d{4}-\d\d-\d\d$/.test(lines[i + 1])) continue
    const date = lines[i + 1]
    if (!date.startsWith('2026')) continue
    rows.set(m[1], `${date}\t${col}\t${m[4].trim()}\t${m[1]}`)
  }
}
const out = [...rows.values()].sort().reverse()
writeFileSync('.probe/C15-heb.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length, out.filter((r) => r.includes('\tzjsc\t')).length, out.filter((r) => r.includes('\tdjcf\t')).length)

// Merges the CCDI list pages fetched by R06-peek.ts (names starting with the given prefix) into one dated list
//   node research/scripts/C15-list.ts c15wb -> .probe/C15-list.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const prefix = process.argv[2] ?? 'c15'
const seen = new Map<string, string>()
for (const f of readdirSync('.probe').filter((f) => f.startsWith(`R06-peek-${prefix}`))) {
  const lines = readFileSync(`.probe/${f}`, 'utf8').split('\n').map((l) => l.trim())
  for (let i = 0; i + 2 < lines.length; i++) {
    const m = lines[i].match(/^\[([^\]]*t(20\d{6})_\d+\.html)\]$/)
    if (!m || !/^\d{4}-\d\d-\d\d$/.test(lines[i + 2])) continue
    const title = lines[i + 1].replace(/^\u200b/, '')
    if (!seen.has(title)) seen.set(title, `${lines[i + 2]}\t${title}\t${m[1]}\t${f.replace('R06-peek-', '').replace('.txt', '')}`)
  }
}
const rows = [...seen.values()].sort().reverse()
writeFileSync('.probe/C15-list.txt', rows.join('\n') + '\n', 'utf8')
console.log(rows.length)

// Merges the CCDI list pages fetched by R06-peek.ts into one dated list: node research/scripts/R06-list.ts prefix out
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const [prefix, out] = process.argv.slice(2)
const seen = new Map<string, string>()
for (const f of readdirSync('.probe').filter((f) => f.startsWith(`R06-peek-${prefix}`))) {
  const lines = readFileSync(`.probe/${f}`, 'utf8').split('\n').map((l) => l.trim())
  for (let i = 0; i + 2 < lines.length; i++) {
    const m = lines[i].match(/^\[([^\]]*t(20\d{6})_\d+\.html)\]$/)
    if (!m || !/^\d{4}-\d\d-\d\d$/.test(lines[i + 2])) continue
    const key = lines[i + 1]
    if (!seen.has(key)) seen.set(key, `${lines[i + 2]}\t${key}\t${m[1].replace(/^(\.\.\/)+/, 'https://www.ccdi.gov.cn/').replace(/^\.\//, 'https://www.ccdi.gov.cn/scdcn/zggb/zjsc/')}\t${f}`)
  }
}
const rows = [...seen.values()].sort().reverse()
writeFileSync(`.probe/${out}`, rows.join('\n'), 'utf8')
console.log(rows.length, rows.at(-1)?.slice(0, 10))

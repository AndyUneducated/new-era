// K09: for name pairs (one pair per line, "甲 乙"), print every archived paragraph that names both. → .probe/K09-pair.txt
// Usage: node research/scripts/K09-pair.ts --file=.probe/K09-pairs.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const file = process.argv.find((a) => a.startsWith('--file='))?.slice(7) ?? '.probe/K09-pairs.txt'
const pairs = readFileSync(file, 'utf8').split(/[\r\n]+/).map((s) => s.trim().split(/\s+/)).filter((p) => p.length >= 2)
const d = loadAll()
const out: string[] = []
for (const [x, y, ...extra] of pairs) {
  out.push(`######## ${x} + ${y}`)
  let n = 0
  for (const [sid, t] of d.texts) {
    if (!t.includes(x) || !t.includes(y)) continue
    for (const para of t.split(/\n+/)) {
      if (!para.includes(x) || !para.includes(y)) continue
      if (extra.length && !extra.some((e) => para.includes(e))) continue
      const i = Math.max(0, Math.min(para.indexOf(x), para.indexOf(y)) - 120)
      out.push(`   [${sid}] ${para.slice(i, i + 360)}`)
      if (++n >= 12) break
    }
    if (n >= 12) break
  }
}
writeFileSync(path('.probe', 'K09-pair.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

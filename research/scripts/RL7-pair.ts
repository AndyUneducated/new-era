// RL7: sentences in any archived source text containing both names of a pair → .probe/RL7-pair.txt
// usage: node research/scripts/RL7-pair.ts 甲,乙 丙,丁 ...
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'

const dir = path('sources', 'text')
const texts = readdirSync(dir)
  .filter((f) => f.endsWith('.txt'))
  .map((f) => [f.slice(0, -4), readFileSync(path('sources', 'text', f), 'utf8')] as const)
const out: string[] = []
for (const arg of process.argv.slice(2)) {
  const [a, b] = arg.split(',')
  out.push(`######## ${a} + ${b}`)
  let n = 0
  const seen = new Set<string>()
  for (const [sid, t] of texts) {
    if (!t.includes(a) || !t.includes(b)) continue
    for (const s of t.split(/(?<=[。；！？\n])/)) {
      const x = s.trim()
      if (!x.includes(a) || !x.includes(b) || x.length > 600 || seen.has(x)) continue
      seen.add(x)
      out.push(`   [${sid}] ${x.slice(0, 400)}`)
      if (++n >= 8) break
    }
    if (n >= 8) break
  }
}
writeFileSync(path('.probe', 'RL7-pair.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

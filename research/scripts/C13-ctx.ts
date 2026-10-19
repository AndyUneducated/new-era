// node research/scripts/C13-ctx.ts <outname> <name...>: for each name, the case id and 80 chars either side of each mention in content/cases/*.yaml
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const [outname, ...names] = process.argv.slice(2)
const out: string[] = []
for (const f of readdirSync('content/cases').filter((f) => f.endsWith('.yaml'))) {
  const lines = readFileSync(`content/cases/${f}`, 'utf8').split(/\r?\n/)
  let caseId = ''
  for (const line of lines) {
    const m = line.match(/^- id: (\S+)/)
    if (m) caseId = m[1]
    for (const n of names) {
      let i = line.indexOf(n)
      while (i >= 0) {
        out.push(`${n} | ${f} ${caseId} | ${line.slice(Math.max(0, i - 80), i + n.length + 80).trim()}`)
        i = line.indexOf(n, i + n.length)
      }
    }
  }
}
writeFileSync(`.probe/${outname}.txt`, out.join('\n') + '\n', 'utf8')

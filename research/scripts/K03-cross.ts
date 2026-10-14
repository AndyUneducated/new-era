// Cross-checks the K03 names against lists of fallen officials (text files given as arguments, e.g. the zhwiki
// list of officials fallen since the 18th congress and a compiled roll of CCDI central-cadre cases), printing
// every line that names a K03 person. Short names also match inside longer ones, so hits are read by hand.
//   node research/scripts/K03-cross.ts file1 file2 ...   -> .probe/K03-cross.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const roster = JSON.parse(readFileSync(join(ROOT, '.probe/K03-roster.json'), 'utf8')) as { names: { name: string }[] }
const out: string[] = []
for (const f of process.argv.slice(2)) {
  const lines = readFileSync(f, 'utf8').split('\n')
  out.push(`=== ${f}`)
  for (const { name } of roster.names) {
    const short = name.split('·')[0]
    const hits = lines.filter((l) => l.includes(name) || (short !== name && l.includes(short)))
    for (const h of hits) out.push(`${name}\t${h.trim().slice(0, 240)}`)
  }
}
writeFileSync(join(ROOT, '.probe/K03-cross.txt'), out.join('\n') + '\n')
console.log(`${out.length} lines -> .probe/K03-cross.txt`)

// R02 one-off: dump the stored text of the named sources into one file for reading.
//   node research/scripts/R02-texts.ts id1 id2 ...   writes .probe/R02-texts.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const out: string[] = []
for (const id of process.argv.slice(2)) {
  const p = `sources/text/${id}.txt`
  out.push(`######## ${id}\n${existsSync(p) ? readFileSync(p, 'utf8') : '(missing)'}`)
}
writeFileSync('.probe/R02-texts.txt', out.join('\n') + '\n', 'utf8')
console.log(`${out.length} texts`)

// dump the archived text of the given source ids into one probe file
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const outArg = process.argv.find((a) => a.startsWith('--out='))
const out = outArg ? outArg.slice(6) : '.probe/cs8-dump.txt'
const parts: string[] = []
for (const id of ids) {
  const f = `sources/text/${id}.txt`
  parts.push(`######## ${id}`, existsSync(f) ? readFileSync(f, 'utf8') : '(missing)', '')
}
writeFileSync(out, parts.join('\n'))

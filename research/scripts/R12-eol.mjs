// report line endings of content files: node research/scripts/R12-eol.mjs file...
import { readFileSync } from 'node:fs'
for (const f of process.argv.slice(2)) {
  const t = readFileSync(f, 'utf8')
  const crlf = (t.match(/\r\n/g) ?? []).length
  const lf = (t.match(/(?<!\r)\n/g) ?? []).length
  console.log(`${f}\tcrlf=${crlf}\tlone-lf=${lf}`)
}

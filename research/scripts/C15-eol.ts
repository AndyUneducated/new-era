// Counts CRLF vs bare LF line endings in the given files (to confirm edits kept CRLF).
//   node research/scripts/C15-eol.ts file1 file2 ... -> .probe/C15-eol.txt
import { readFileSync, writeFileSync } from 'node:fs'

const out = process.argv.slice(2).map((f) => {
  const s = readFileSync(f, 'utf8')
  const crlf = (s.match(/\r\n/g) ?? []).length
  const lf = (s.match(/(?<!\r)\n/g) ?? []).length
  return `${f}\tCRLF=${crlf}\tLF=${lf}`
})
writeFileSync('.probe/C15-eol.txt', out.join('\n') + '\n', 'utf8')

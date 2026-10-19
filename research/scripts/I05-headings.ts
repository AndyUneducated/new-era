// Lists the numbered headings (（一）…、一、…、——…、第一…) of source texts, with line numbers, into .probe/I05-headings.txt.
// Usage: node research/scripts/I05-headings.ts <source id> ...
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const out: string[] = []
for (const id of process.argv.slice(2)) {
  out.push(`=== ${id}`)
  const lines = readFileSync(join(ROOT, 'sources', 'text', `${id}.txt`), 'utf8').split('\n')
  lines.forEach((l, i) => {
    if (/^(（[一二三四五六七八九十]+）|[一二三四五六七八九十]+、|——|第[一二三四五六七八九十]+[，、是])/.test(l) || /坚持|必须/.test(l.slice(0, 6)))
      out.push(`${i + 1}: ${l.slice(0, 90)}`)
  })
}
writeFileSync(join(ROOT, '.probe', 'I05-headings.txt'), out.join('\n') + '\n')

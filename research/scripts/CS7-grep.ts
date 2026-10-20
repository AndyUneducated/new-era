// print every sentence (split on 。) in the given source texts that matches a pattern
import { readFileSync, writeFileSync } from 'node:fs'

const [pattern, out, ...ids] = process.argv.slice(2)
const re = new RegExp(pattern)
const lines: string[] = []
for (const id of ids) {
  const text = readFileSync(`sources/text/${id}.txt`, 'utf8')
  lines.push(`## ${id}`)
  for (const s of text.split(/(?<=[。\n])/)) if (re.test(s)) lines.push(s.trim())
}
writeFileSync(out, lines.join('\n'))

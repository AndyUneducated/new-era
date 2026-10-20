// BD1: show raw HTML around a needle in a dumped page -> .probe/bd1-dump2.txt
import { readFileSync, writeFileSync } from 'node:fs'

const [file, needle] = process.argv.slice(2)
const t = readFileSync(file, 'utf8')
const out: string[] = []
let i = t.indexOf(needle)
while (i >= 0 && out.length < 4) {
  out.push(t.slice(Math.max(0, i - 2500), i + 300).replace(/\s+/g, ' '))
  i = t.indexOf(needle, i + 1)
}
writeFileSync('.probe/bd1-dump2.txt', out.join('\n\n=====\n\n') + '\n', 'utf8')

// T01 one-off: for every person, the probe / expulsion lines of the CCDI column lists and the round-ups naming them.
// node research/scripts/T01-falls.ts   writes .probe/T01-falls.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { PEOPLE } from './T01-spec.ts'

const dir = 'sources/text'
const lists = readdirSync(dir).filter((f) => /^t01-ccdi-(zjsc|jlsc|djcf)-list-p\d\.txt$/.test(f))
const others = readdirSync(dir).filter((f) => f.startsWith('t01-') && !lists.includes(f))
const out: string[] = []
for (const [name, id] of PEOPLE) {
  out.push(`## ${name} ${id}`)
  for (const f of lists) {
    const lines = readFileSync(`${dir}/${f}`, 'utf8').split(/\r?\n/).filter((l) => l.trim())
    lines.forEach((l, i) => {
      if (l.includes(name)) out.push(`  ${f.replace('.txt', '')}  ${lines[i + 1] ?? ''}  ${l}`)
    })
  }
  const hits = others.filter((f) => readFileSync(`${dir}/${f}`, 'utf8').includes(name)).map((f) => f.replace('.txt', ''))
  out.push(`  other: ${hits.join(' ')}`)
}
writeFileSync('.probe/T01-falls.txt', out.join('\n') + '\n', 'utf8')
console.log('wrote .probe/T01-falls.txt')

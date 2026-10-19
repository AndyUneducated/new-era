// Dump the named people (all of content/people) to .probe/R04-peek.txt, so Chinese text can be read as UTF-8.
//   node research/scripts/R04-peek.ts id1 id2 ...      by id
//   node research/scripts/R04-peek.ts --name 某某 ...  by name
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse, stringify } from 'yaml'

const args = process.argv.slice(2)
const byName = args.includes('--name')
const wanted = new Set(args.filter((a) => !a.startsWith('--')))
const out: string[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  const list = parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []
  for (const p of list) {
    if (wanted.has(byName ? p.name : p.id)) out.push(`### ${f}\n${stringify(p, { lineWidth: 0 })}`)
  }
}
writeFileSync('.probe/R04-peek.txt', out.join('\n'), 'utf8')
console.log(`${out.length} entries`)

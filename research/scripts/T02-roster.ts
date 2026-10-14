// T02: write research/roster/T02.yaml from content/people/T02.yaml and print the case count by the year of the
// first fall step (investigation notice, or the earliest archived step when the notice itself is not archived).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const root = join(import.meta.dirname, '..', '..')
const cards = parse(readFileSync(join(root, 'content/people/T02.yaml'), 'utf8')) as {
  id: string
  name: string
  status: string
  fall: { date: string | number }[]
}[]
const lines = ['# T02 (round 4): non-CC centrally managed cadres investigated since late 2017']
for (const c of cards) lines.push(`- { id: ${c.id}, name: ${c.name}, batch: T02, tier: 2 }`)
writeFileSync(join(root, 'research/roster/T02.yaml'), lines.join('\n') + '\n', 'utf8')

const byYear: Record<string, string[]> = {}
const status: Record<string, number> = {}
for (const c of cards) {
  const y = String(c.fall[0]?.date ?? '?').slice(0, 4)
  ;(byYear[y] ??= []).push(c.name)
  status[c.status] = (status[c.status] ?? 0) + 1
}
const out = [`cards ${cards.length}`, JSON.stringify(status)]
for (const y of Object.keys(byYear).sort()) out.push(`${y}\t${byYear[y].length}\t${byYear[y].join('、')}`)
writeFileSync(join(root, '.probe/T02-years.txt'), out.join('\n'), 'utf8')
console.log(out.length)

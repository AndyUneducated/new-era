// T01 one-off: write research/roster/T01.yaml from content/people/T01.yaml, and count the cards by year of first step.
// node research/scripts/T01-roster.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const people = parse(readFileSync('content/people/T01.yaml', 'utf8')) as { id: string; name: string; tier: number; fall: { date: string | Date }[] }[]
const lines = ['# T01: centrally managed cadres investigated 2012-11 to 2017-10 who never sat on the Central Committee', '']
const years: Record<string, number> = {}
for (const p of people) {
  lines.push(`- { id: ${p.id}, name: ${p.name}, batch: T01, tier: ${p.tier} }`)
  const y = String(p.fall[0].date instanceof Date ? p.fall[0].date.toISOString() : p.fall[0].date).slice(0, 4)
  years[y] = (years[y] ?? 0) + 1
}
writeFileSync('research/roster/T01.yaml', lines.join('\n') + '\n', 'utf8')
writeFileSync('.probe/T01-years.txt', `${people.length}\n${JSON.stringify(years)}\n`, 'utf8')
console.log(people.length, years)

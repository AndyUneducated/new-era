import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
import { NAMES } from './R03-scan.ts'
const out: string[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  for (const p of parse(readFileSync('content/people/' + f, 'utf8')) ?? []) {
    const first = (p.fall ?? [])[0]
    if (!first || NAMES.includes(p.name)) continue
    if (/^201[67]/.test(String(first.date))) out.push(`${p.name} ${p.id} [${f}] ${first.date} ${String(first.text).slice(0, 70)} roles=${p.roles}`)
  }
}
writeFileSync('.probe/R03-missing.txt', out.join('\n') + '\n')
console.log(out.length)

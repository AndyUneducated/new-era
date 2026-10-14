import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const people = new Map<string, any>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as any[]) people.set(p.id, { ...p, file: f })

const chiefs = parse(readFileSync('content/chiefs/P02.yaml', 'utf8')) as any[]
const out: string[] = []
const seen = new Set<string>()
for (const c of chiefs) {
  if (!c.person || seen.has(`${c.prov} ${c.person}`)) continue
  seen.add(`${c.prov} ${c.person}`)
  const p = people.get(c.person)
  if (!p) {
    out.push(`MISSING ${c.prov} ${c.name} ${c.person}`)
    continue
  }
  const blob = JSON.stringify(p)
  const flag = blob.includes(c.prov) ? 'ok ' : 'CHECK'
  out.push(`${flag} ${c.prov} ${c.post} ${c.name} ${c.person} (${p.file}, ${p.born ?? '?'}) ${p.headline ?? ''}`)
}
writeFileSync('.probe/p02-verify.txt', out.sort().join('\n') + '\n')
console.log(out.length)

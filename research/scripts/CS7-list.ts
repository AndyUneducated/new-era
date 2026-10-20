// list every person card whose headline or positions touch the navy or air force
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const dir = (d: string) => readdirSync(d).filter((f) => f.endsWith('.yaml')).map((f) => `${d}/${f}`)
const people: any[] = []
for (const f of dir('content/people')) {
  const list = parse(readFileSync(f, 'utf8')) ?? []
  for (const p of list) people.push({ ...p, _file: f })
}
const falls = new Map<string, string>()
for (const f of dir('content/falls')) {
  const m = parse(readFileSync(f, 'utf8')) ?? {}
  for (const k of Object.keys(m)) falls.set(k, f)
}
const inCases = new Map<string, string[]>()
for (const f of dir('content/cases')) {
  for (const c of parse(readFileSync(f, 'utf8')) ?? []) for (const id of c.people ?? []) inCases.set(id, [...(inCases.get(id) ?? []), c.id])
}
const re = new RegExp(process.argv[2] ?? '海军|空军|舰队|航空兵|海航|空降兵')
const out: string[] = []
for (const p of people) {
  const pos = (p.positions ?? []).map((x: any) => `${x.title}(${x.from ?? ''}–${x.to ?? ''})`).join('; ')
  if (!re.test(`${p.headline} ${pos} ${p.bio}`)) continue
  out.push(
    [p.id, p.name, p.status, p._file.replace('content/people/', ''), p.headline, `falls:${falls.get(p.id) ?? '-'}`, `cases:${(inCases.get(p.id) ?? []).join(',')}`, `born:${p.born ?? ''}`].join('\t'),
  )
  out.push(`    note: ${p.statusNote ?? ''}`)
  for (const s of p.fall ?? []) out.push(`    fall ${s.date} ${s.text} [${s.cite}]`)
  out.push(`    pos: ${pos}`)
}
writeFileSync(process.argv[3] ?? '.probe/CS7-people.txt', out.join('\n'))
console.log(out.length)

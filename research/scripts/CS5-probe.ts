// CS5: dump what the case articles need from the last full build (public/data/db.json) and content/falls into .probe/
//   node research/scripts/CS5-probe.ts life            → everyone whose fall mentions 终身监禁
//   node research/scripts/CS5-probe.ts names 苏荣 姚木根 → cards matching these names
//   node research/scripts/CS5-probe.ts ids su-rong ...  → full card + case record
//   node research/scripts/CS5-probe.ts grep 南充        → people whose bio/life/fall mention the string
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const db = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const people: any[] = db.people
const r08 = new Set(
  (parse(readFileSync('content/people/R08.yaml', 'utf8')) as any[]).map((p) => p.id),
)
const falls: Record<string, any> = {}
for (const f of readdirSync('content/falls')) {
  if (f === 'R08.yaml' || f.startsWith('00')) continue
  Object.assign(falls, parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {})
}
const [mode, ...args] = process.argv.slice(2)
const out: string[] = []
const line = (p: any) =>
  `${p.id}\t${p.name}\t${p.status}\t${p.headline ?? ''}${r08.has(p.id) ? '\t[R08]' : ''}`
const steps = (p: any) => (p.fall ?? []).map((s: any) => `   ${s.date}  ${s.text}  [${s.cite}]`).join('\n')

if (mode === 'life') {
  for (const p of people) {
    const all = [...(p.fall ?? []), ...(falls[p.id]?.fall ?? [])]
    if (!all.some((s: any) => /终身监禁/.test(s.text))) continue
    out.push(line(p))
    out.push(all.map((s: any) => `   ${s.date}  ${s.text}  [${s.cite}]`).join('\n'))
    const r = falls[p.id]
    if (r) out.push(`   sys=${r.sys} grade=${r.grade} amount=${r.amount?.text ?? ''} politics=${r.politics?.level ?? ''}`)
  }
} else if (mode === 'names') {
  for (const n of args) {
    const hit = people.filter((p) => p.name === n || (p.aka ?? []).includes(n))
    out.push(hit.length ? hit.map(line).join('\n') : `${n}\t—`)
  }
} else if (mode === 'ids') {
  for (const id of args) {
    const p = people.find((x) => x.id === id)
    if (!p) { out.push(`${id}: no card`); continue }
    out.push('==== ' + line(p))
    out.push('bio: ' + (p.bio ?? ''))
    out.push('positions: ' + (p.positions ?? []).map((x: any) => `${x.title}(${x.from}–${x.to ?? ''})`).join('; '))
    out.push('cites: ' + (p.cites ?? []).join(', '))
    for (const l of p.life ?? []) out.push(`life ${l.h} ${l.from}–${l.to}: ${l.text} [${l.cites.join(', ')}]`)
    out.push(steps(p))
    const r = falls[id]
    if (r) out.push('record: ' + JSON.stringify(r, null, 1))
  }
} else if (mode === 'grep') {
  const re = new RegExp(args[0])
  for (const p of people) {
    const txt = [p.bio, ...(p.life ?? []).map((l: any) => l.text), ...(p.fall ?? []).map((s: any) => s.text), JSON.stringify(falls[p.id] ?? '')].join(' ')
    if (re.test(txt)) out.push(line(p))
  }
}
writeFileSync('.probe/cs5-probe.txt', out.join('\n') + '\n')

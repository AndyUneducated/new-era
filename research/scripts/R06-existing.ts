// Lists people already on file whose first fall step is in 2024 or later, for research/falls-list/R06.yaml.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const dir = 'content/people'
const out: string[] = []
const falls = new Set<string>()
for (const f of readdirSync('content/falls')) {
  if (!f.endsWith('.yaml')) continue
  const doc = parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}
  for (const id of Object.keys(doc)) falls.add(`${id}@${f}`)
}
for (const f of readdirSync(dir).sort()) {
  if (!f.endsWith('.yaml')) continue
  const list = parse(readFileSync(`${dir}/${f}`, 'utf8')) ?? []
  for (const p of list) {
    const steps = (p.fall ?? []) as { date: string | number; text: string; cite: string }[]
    if (!steps.length) continue
    const first = steps.map((s) => String(s.date)).sort()[0]
    if (first < '2024') continue
    const last = (p.positions ?? []).slice(-2).map((x: any) => `${x.title}(${x.from ?? ''}-${x.to ?? ''})`).join('; ')
    const rec = [...falls].filter((x) => x.startsWith(`${p.id}@`)).join(',')
    out.push(`${first}\t${p.id}\t${p.name}\t${f}\t${p.status}\t[${(p.roles ?? []).join(',')}]\t${last}\trec=${rec}`)
    for (const s of steps) out.push(`\t\t${s.date} ${s.text} <${s.cite}>`)
  }
}
writeFileSync('.probe/R06-existing.txt', out.join('\n'), 'utf8')
console.log(out.filter((l) => !l.startsWith('\t')).length)

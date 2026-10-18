// For each R06 person on file: fall steps, the cited sources (text on disk?), and every registered source whose
// title names them. Output: .probe/R06-digest.txt
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const master = JSON.parse(readFileSync('.probe/R06-master.json', 'utf8')) as { date: string; name: string; post: string; cands: { id: string }[] }[]
const SKIP = new Set(['li-wei-drc', 'li-wei-pla', 'wang-jianjun', 'zhang-ping', 'wang-yong'])
const people = new Map<string, any>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) people.set(p.id, { ...p, file: f })
const sources: { id: string; title: string; date?: string; url: string; file: string }[] = []
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const s of parse(readFileSync(`research/manifests/${f}`, 'utf8'))?.web ?? []) sources.push({ ...s, file: f })
  } catch {}
}
const len = (id: string) => (existsSync(`sources/text/${id}.txt`) ? statSync(`sources/text/${id}.txt`).size : -1)
const out: string[] = []
for (const m of master) {
  for (const c of m.cands.filter((c) => !SKIP.has(c.id))) {
    const p = people.get(c.id)
    out.push(`== ${m.date} ${m.name} ${c.id} (${p.file}) status=${p.status} ${p.statusNote ?? ''}`)
    out.push(`   post: ${m.post}`)
    for (const s of p.fall ?? []) out.push(`   F ${s.date} ${s.text} <${s.cite} ${len(s.cite)}>`)
    out.push(`   cites: ${(p.cites ?? []).join(', ')}`)
    for (const s of sources.filter((s) => s.title.includes(m.name))) out.push(`   S ${s.id} [${s.date ?? ''}] ${s.title} (${len(s.id)})`)
  }
}
writeFileSync('.probe/R06-digest.txt', out.join('\n'), 'utf8')
console.log(out.length)

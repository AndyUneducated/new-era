// For every done:false name in the R03/R05/R06 fall lists: cards with that name (any batch), roster entries,
// and whether a case record exists. Output: .probe/R07-have.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Row = { name: string; date: string; post: string; id?: string; done: boolean }
type P = { id: string; name: string; status: string; fall?: unknown[]; positions?: { title: string }[] }
const people: (P & { file: string })[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) people.push({ ...p, file: f })
const roster: { id: string; name: string; batch: string }[] = []
for (const f of readdirSync('research/roster').filter((f) => f.endsWith('.yaml')))
  roster.push(...((parse(readFileSync(`research/roster/${f}`, 'utf8')) ?? []) as typeof roster))
roster.push(...((parse(readFileSync('research/roster.yaml', 'utf8')) ?? []) as typeof roster))
const falls = new Map<string, string>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const id of Object.keys((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as object)) falls.set(id, f)
const texts = readdirSync('sources/text')

const out: string[] = []
for (const list of ['R05', 'R06', 'R03']) {
  const rows = (parse(readFileSync(`research/falls-list/${list}.yaml`, 'utf8')) ?? []) as Row[]
  for (const r of rows.filter((r) => !r.done)) {
    const cands = people.filter((p) => p.name === r.name)
    const ros = roster.filter((x) => x.name === r.name && !cands.some((c) => c.id === x.id))
    const c = cands.map((p) => `${p.id}@${p.file}[${p.status};fall=${(p.fall ?? []).length};${p.positions?.at(-1)?.title ?? ''}]${falls.has(p.id) ? ' FALL@' + falls.get(p.id) : ''}`)
    out.push(`${list}\t${r.date}\t${r.name}\t${r.post}\t${c.join(' | ')}${ros.length ? ` ROSTER:${ros.map((x) => `${x.id}/${x.batch}`).join(',')}` : ''}`)
  }
}
writeFileSync('.probe/R07-have.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length, texts.length)

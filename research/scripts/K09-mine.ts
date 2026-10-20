// K09: for each list person still without any relation, print the card's positions and cites, sentences in all
// archived texts naming the person with succession / partner keywords, and other cards holding the same title
// in the same place around the same time. → .probe/K09-mine.txt
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R17-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
type Pos = { title: string; place?: string; from?: string; to?: string }
type P = { id: string; name: string; aka?: string[]; cites: string[]; positions?: Pos[] }
const people = d.people as unknown as P[]
const byId = new Map(people.map((p) => [p.id, p]))
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const kw = /接替|接任|继任|前任|搭档|搭班子|提拔|提携|重用|栽培|老部下|老上级|秘书|空降|之后由|继其|交接|不再担任|免去/
const ym = (s?: string) => (s ? Number(s.slice(0, 4)) + (s.length >= 7 ? (Number(s.slice(5, 7)) - 1) / 12 : 0) : NaN)
const norm = (t: string) => t.replace(/[（(].*?[)）]/g, '').replace(/原|党组|成员|委员|、/g, '')
const out: string[] = []
for (const [id, name, , head] of list) {
  if (related.has(id)) continue
  const p = byId.get(id)
  out.push(`######## ${name} (${id}) | ${head}${p ? '' : ' [NO CARD]'}`)
  if (!p) continue
  for (const q of p.positions ?? []) {
    out.push(`  POS ${q.from ?? '?'}–${q.to ?? ''} ${q.place ?? ''} ${q.title}`)
    const nt = norm(q.title)
    for (const o of people) {
      if (o.id === id) continue
      for (const r of o.positions ?? []) {
        if ((r.place ?? '') !== (q.place ?? '') || norm(r.title) !== nt) continue
        const near = (a?: string, b?: string) => Math.abs(ym(a) - ym(b)) <= 1
        const tag = near(r.to, q.from) ? 'PRED' : near(r.from, q.to) ? 'SUCC' : ''
        if (tag) out.push(`     ${tag} ${o.name} (${o.id}) ${r.from ?? '?'}–${r.to ?? ''} ${r.title}`)
      }
    }
  }
  out.push(`  CITES ${p.cites.join(' ')}`)
  const names = [name, ...(p.aka ?? [])].filter((x) => x.length >= 2)
  const seen = new Set<string>()
  for (const [sid, t] of d.texts) {
    if (!names.some((n) => t.includes(n))) continue
    for (const s of t.split(/(?<=[。；！？\n])/)) {
      const x = s.trim()
      if (x.length < 6 || x.length > 400 || seen.has(x)) continue
      if (!names.some((n) => x.includes(n)) || !kw.test(x)) continue
      seen.add(x)
      out.push(`   [${sid}] ${x.slice(0, 300)}`)
    }
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'K09-mine.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

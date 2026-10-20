// K08: for each list person still without any relation, print the card's positions and cites, and sentences in the
// cited (and all wiki) texts naming the person with succession / partner keywords. → .probe/K08-mine.txt
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
const byId = new Map(d.people.map((p) => [p.id, p]))
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const kw = /接替|接任|继任|前任|搭档|搭班子|提拔|提携|重用|栽培|老部下|老上级|调任|调离|空降|升任|由[^。]{1,8}任|之后由|继其|改任|免去|赴任/
const out: string[] = []
for (const [id, name, , head] of list) {
  if (related.has(id)) continue
  const p = byId.get(id) as unknown as {
    aka: string[]
    cites: string[]
    positions?: { title: string; place?: string; from?: string; to?: string }[]
  }
  out.push(`######## ${name} (${id}) | ${head}${p ? '' : ' [NO CARD]'}`)
  if (!p) continue
  for (const q of p.positions ?? []) out.push(`  POS ${q.from ?? '?'}–${q.to ?? ''} ${q.place ?? ''} ${q.title}`)
  out.push(`  CITES ${p.cites.join(' ')}`)
  const names = [name, ...(p.aka ?? [])].filter((x) => x.length >= 2)
  const seen = new Set<string>()
  for (const sid of p.cites) {
    const t = d.texts.get(sid)
    if (!t) continue
    for (const s of t.split(/(?<=[。；！？\n])/)) {
      const x = s.trim()
      if (x.length < 6 || x.length > 400 || seen.has(x)) continue
      if (!names.some((n) => x.includes(n)) && !sid.includes('wiki')) continue
      if (!kw.test(x)) continue
      seen.add(x)
      out.push(`   [${sid}] ${x.slice(0, 300)}`)
    }
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'K08-mine.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

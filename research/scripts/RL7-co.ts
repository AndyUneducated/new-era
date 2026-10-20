// RL7: for each list person still without relations, sentences in the person's own sources (card cites and any
// source id containing the person id) that name another card holder. → .probe/RL7-co.txt
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R19-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
type P = { id: string; name: string; aka?: string[]; cites: string[] }
const people = d.people as unknown as P[]
const byId = new Map(people.map((p) => [p.id, p]))
const names = people.flatMap((p) => [p.name, ...(p.aka ?? [])].filter((n) => n && n.length >= 3).map((n) => [n, p.id] as const))
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const out: string[] = []
for (const [id, name] of list) {
  if (related.has(id)) continue
  const p = byId.get(id)
  if (!p) continue
  const noisy = /list|verdicts|tigers|roundup|notice|qualification|cca|cppcc|-cc|plenum|inspection|three|four|five|six|nine|generals|-ten|life|swindlers|sanbufu|expel-|ccdi-2015|people-2016-01-02/
  const sids = new Set([...p.cites, ...[...d.texts.keys()].filter((s) => s.includes(id))].filter((s) => !noisy.test(s)))
  out.push(`######## ${name} (${id})`)
  const seen = new Set<string>()
  for (const sid of sids) {
    const t = d.texts.get(sid)
    if (!t) continue
    for (const s of t.split(/(?<=[。；！？\n])/)) {
      const x = s.trim()
      if (x.length < 6 || x.length > 400 || seen.has(x)) continue
      const hits = [...new Set(names.filter(([n, oid]) => oid !== id && n !== name && x.includes(n)).map(([, oid]) => oid))]
      if (!hits.length) continue
      seen.add(x)
      out.push(`   [${sid}] ${x.slice(0, 300)}  <<${hits.join(' ')}>>`)
    }
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL7-co.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

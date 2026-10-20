// RL7: for each list person still without relations, sentences in ANY archived source text that name the person,
// another card holder, and a succession / subordinate keyword. → .probe/RL7-rev.txt
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R19-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
type P = { id: string; name: string; aka?: string[] }
const people = d.people as unknown as P[]
const names = people.flatMap((p) => [p.name, ...(p.aka ?? [])].filter((n) => n && n.length >= 2).map((n) => [n, p.id] as const))
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const kw = /接替|接任|继任|前任|搭档|下属|副手|上司|老领导|秘书|提拔|提携|→|旧部|部下|搭班|班长|老乡|亲信|心腹|主持工作|交接|宣布.{0,20}任命/
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',')
const sents: [string, string][] = []
for (const [sid, t] of d.texts) for (const s of t.split(/(?<=[。；！？\n])/)) if (s.length >= 8 && s.length <= 500 && kw.test(s)) sents.push([sid, s.trim()])
const out: string[] = []
for (const [id, name] of list) {
  if (related.has(id) || (only && !only.includes(id))) continue
  out.push(`######## ${name} (${id})`)
  const seen = new Set<string>()
  let n = 0
  for (const [sid, x] of sents) {
    if (!x.includes(name) || seen.has(x)) continue
    const hits = [...new Set(names.filter(([nm, oid]) => oid !== id && nm !== name && !name.includes(nm) && x.includes(nm)).map(([, oid]) => oid))]
    if (!hits.length || hits.length > 8) continue
    seen.add(x)
    out.push(`   [${sid}] ${x.slice(0, 320)}  <<${hits.join(' ')}>>`)
    if (++n >= 12) break
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL7-rev.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

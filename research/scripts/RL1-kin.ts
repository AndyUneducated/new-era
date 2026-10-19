// RL1: kin candidates from card headlines ("某某之子", "某某夫人" …) — for each card whose headline names
// another card's person with a kin word, and no relation yet between the two, list sentences from the
// card's own cited sources (then any source) that name both.
// Run: node research/scripts/RL1-kin.ts --batch=RL1 → .probe/RL1-kin.txt (UTF-8)
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const have = new Set(d.relations.map((r) => [r.a, r.b].sort().join('|')))
const src = new Map(d.sources.map((s) => [s.id, s]))
const kinWord = /之子|之女|长子|次子|三子|幼子|长女|次女|夫人|之妻|妻子|丈夫|女婿|儿媳|之弟|之兄|胞弟|胞兄|弟弟|哥哥|姐姐|妹妹|侄|外甥|孙子|孙女|外孙|岳父|父亲|母亲|姐夫|妹夫/
const names: [string, string][] = []
for (const p of d.people) for (const n of [p.name, ...p.aka]) if (n && n.length >= 2) names.push([n, p.id])
const byId = new Map(d.people.map((p) => [p.id, p]))
const out: string[] = []
const nameToIds = new Map<string, string[]>()
for (const p of d.people) nameToIds.set(p.name, [...(nameToIds.get(p.name) ?? []), p.id])
for (const p of d.people) {
  const fam = ((p as { family?: { name: string; rel: string; cites: string[] }[] }).family ?? [])
  for (const f of fam) {
    for (const other of nameToIds.get(f.name) ?? []) {
      if (other === p.id || have.has([p.id, other].sort().join('|'))) continue
      out.push(`==== FAMILY ${p.name}(${p.id}) — ${f.name}(${other}) rel=${f.rel} cites=${f.cites.join(',')}`)
    }
  }
}
for (const p of d.people) {
  const head = (p as { headline?: string }).headline ?? ''
  if (!kinWord.test(head)) continue
  for (const [n, other] of names) {
    if (other === p.id || !head.includes(n)) continue
    if (have.has([p.id, other].sort().join('|'))) continue
    const o = byId.get(other)!
    const na = [p.name, ...p.aka]
    const nb = [o.name, ...o.aka]
    const cites: string[] = ((p as { cites?: string[] }).cites ?? []).concat((o as { cites?: string[] }).cites ?? [])
    const hits: string[] = []
    const scan = (ids: Iterable<string>) => {
      for (const id of ids) {
        const t = d.texts.get(id)
        if (!t) continue
        for (const s of t.split(/(?<=[。；！？\n]|\. )/)) {
          if (s.length > 300) continue
          if (na.some((x) => s.includes(x)) && nb.some((x) => s.includes(x)) && kinWord.test(s)) {
            hits.push(`  [${id}${src.get(id)?.rumor ? ' rumor' : ''} ${src.get(id)?.voice}] ${s.trim()}`)
            if (hits.length >= 3) return
          }
        }
      }
    }
    scan(cites)
    if (!hits.length) scan(d.texts.keys())
    out.push(`==== ${p.name}(${p.id}) — ${o.name}(${other})  «${head}»`)
    out.push(...hits)
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL1-kin.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

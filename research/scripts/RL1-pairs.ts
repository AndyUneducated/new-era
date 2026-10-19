// RL1: for each pair of person ids, the sentences in any archived source text that name both people
// (by name, alias or an English name given after =). Used to find a cite and a verbatim quote for a relation.
// Run: node research/scripts/RL1-pairs.ts --batch=RL1 --out=name a:b a:b=EnglishA/EnglishB ...
// → .probe/RL1-pairs-<name>.txt (UTF-8). Rumour sources are marked [rumor].
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const outName = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? 'x'
const max = Number(process.argv.find((a) => a.startsWith('--max='))?.slice(6) ?? 12)
const pairs = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const d = loadAll()
const byId = new Map(d.people.map((p) => [p.id, p]))
const src = new Map(d.sources.map((s) => [s.id, s]))
const sentences: [string, string][] = []
for (const [id, t] of d.texts) for (const s of t.split(/(?<=[。；！？\n]|\. )/)) if (s.length < 700) sentences.push([id, s.trim()])
const out: string[] = []
for (const pair of pairs) {
  const [ids, en] = pair.split('=')
  const [a, b] = ids.split(':')
  const pa = byId.get(a)
  const pb = byId.get(b)
  if (!pa || !pb) {
    out.push(`?? ${pair} (${pa ? '' : a} ${pb ? '' : b} missing)`)
    continue
  }
  const [ea, eb] = (en ?? '').split('/')
  const na = [pa.name, ...pa.aka, ...(ea ? [ea] : [])]
  const nb = [pb.name, ...pb.aka, ...(eb ? [eb] : [])]
  const hits = sentences.filter(([, s]) => na.some((n) => s.includes(n)) && nb.some((n) => s.includes(n)))
  out.push(`==== ${pa.name}(${a}) — ${pb.name}(${b})  ${hits.length} hits`)
  const seen = new Set<string>()
  for (const [id, s] of hits) {
    if (seen.has(s) || seen.size >= max) continue
    seen.add(s)
    const so = src.get(id)
    out.push(`  [${id}${so?.rumor ? ' rumor' : ''} ${so?.voice ?? ''}] ${s}`)
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', `RL1-pairs-${outName}.txt`), out.join('\n') + '\n')
console.log('ok', out.length)

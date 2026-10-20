// broader plea scan of the sources cited by each sentenced person's steps: node research/scripts/R12-plea2.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
const d = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const people = new Map(d.people.map((p) => [p.id, p]))
const src = new Map((Array.isArray(d.sources) ? d.sources : Object.values(d.sources)).map((s) => [s.id, s]))
const ids = readFileSync('research/lists/R15-sentenced-no-plea.txt', 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t')[0])
const KEY = /自首|投案|立功|揭发|检举|退赃|退缴|退赔|退还|认罪|悔罪|如实供述|主动交代|坦白|从轻|减轻|从宽/
const out = []
const nohit = []
for (const id of ids) {
  const p = people.get(id)
  const cites = [...new Set((p.fall ?? []).map((s) => s.cite))]
  const lines = []
  for (const c of cites) {
    const f = `sources/text/${c}.txt`
    if (!existsSync(f)) continue
    const s = src.get(c)
    const t = readFileSync(f, 'utf8')
    const hits = t.split(/[。\n]/).filter((x) => KEY.test(x)).map((x) => x.trim().slice(0, 300))
    if (hits.length) {
      lines.push(`  >> ${c} [${s?.voice}${s?.rumor ? ',RUMOR' : ''}] (${t.length}) ${s?.url ?? ''}`)
      for (const h of [...new Set(hits)].slice(0, 6)) lines.push(`     · ${h}`)
    }
  }
  if (lines.length) out.push(`## ${id} ${p.name}`, ...lines)
  else nohit.push(`${id}\t${p.name}\t${cites.map((c) => `${c}[${src.get(c)?.voice}](${existsSync(`sources/text/${c}.txt`) ? readFileSync(`sources/text/${c}.txt`, 'utf8').length : 0})`).join(' ')}`)
}
writeFileSync('.probe/r12-plea2.txt', out.join('\n'), 'utf8')
writeFileSync('.probe/r12-plea2-nohit.txt', nohit.join('\n'), 'utf8')
console.log(out.filter((l) => l.startsWith('## ')).length, nohit.length)

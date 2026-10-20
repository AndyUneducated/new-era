// BD1: who on the R15 lists still has no born / no positions, with file, cites and headline
//   node research/scripts/BD1-left.ts  -> .probe/bd1-left.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const list = (f: string) =>
  readFileSync(`research/lists/${f}`, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t')[0])
const noBorn = list('R15-no-born.txt')
const noPos = list('R15-no-positions.txt')

const cards = new Map<string, { file: string; p: any }>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  for (const p of parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) cards.set(p.id, { file: f, p })
}
const wdBorn = (p: any) => {
  const q = p.ids?.wikidata
  if (!q) return false
  try { return !!JSON.parse(readFileSync(`research/wikidata/${q}.json`, 'utf8')).born } catch { return false }
}
const out: string[] = []
const bornLeft = noBorn.filter((id) => { const c = cards.get(id); return c && !c.p.born && !wdBorn(c.p) })
const posLeft = noPos.filter((id) => { const c = cards.get(id); return c && !(c.p.positions?.length) })
const line = (id: string) => {
  const { file, p } = cards.get(id)!
  return `${id}\t${p.name}\t${file}\t${p.verify ? 'V' : ''}\t${p.headline ?? ''}\t${(p.cites ?? []).join(',')}`
}
out.push(`# no born: ${bornLeft.length} / ${noBorn.length}`)
for (const id of bornLeft) out.push(line(id))
out.push(`# no positions: ${posLeft.length} / ${noPos.length}`)
for (const id of posLeft) out.push(line(id))
writeFileSync('.probe/bd1-left.txt', out.join('\n') + '\n', 'utf8')

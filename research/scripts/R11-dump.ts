// R11: for the people of R11-list, the card's fall, roles, last posts and every source the card cites, with
// title, voice and the length of the stored text, to pick the cites for trigger and politics.
// Run: node research/scripts/R11-dump.ts --batch=R11 <part> id1 id2 ... → .probe/R11-dump-<part>.txt
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const [part, ...ids] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const d = loadAll()
const out: string[] = []
const cites = (x: unknown, acc = new Set<string>()): Set<string> => {
  if (Array.isArray(x)) x.forEach((y) => cites(y, acc))
  else if (x && typeof x === 'object')
    for (const [k, v] of Object.entries(x)) {
      if ((k === 'cite' || k === 'url') && typeof v === 'string' && k === 'cite') acc.add(v.split('@')[0])
      else if (k === 'cites' && Array.isArray(v)) v.forEach((c) => typeof c === 'string' && acc.add(c.split('@')[0]))
      else cites(v, acc)
    }
  return acc
}
for (const id of ids) {
  const p = d.people.find((x) => x.id === id)
  if (!p) {
    out.push(`### ${id}: no card`)
    continue
  }
  const rec = d.falls.get(id)
  out.push(`### ${p.name}\t${id}\troles=${p.roles.join(',')}\tstatus=${p.status}\tborn=${p.born ?? ''}`)
  out.push(`  ${p.headline}`)
  for (const x of p.positions.slice(-4)) out.push(`  pos ${x.from ?? ''}–${x.to ?? ''} ${x.title}`)
  for (const f of p.fall) out.push(`  fall ${f.date} ${f.text} [${f.cite}]`)
  if (p.statusNote) out.push(`  note ${p.statusNote}`)
  for (const c of cites({ p, rec })) {
    const s = d.sourceById.get(c)
    out.push(`  src ${c}\t${s?.voice ?? '?'}${s?.rumor ? ' RUMOR' : ''}\t${s?.date ?? ''}\t${s?.title ?? ''}\t${d.texts.get(c)?.length ?? 0}`)
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', `R11-dump-${part}.txt`), out.join('\n') + '\n')
console.log(`${ids.length} people`)

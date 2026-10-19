// Lists the concepts that have no policies after concept-more is merged, with what LK3 needs to judge them,
// and every event (to pick ids for policies).
//   node research/scripts/LK3-list.ts --batch=LK3   -> .probe/LK3-concepts.txt, .probe/LK3-events.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadAll } from '../../tools/build/load.ts'
import { ROOT } from '../../tools/build/io.ts'

const d = loadAll()
const empty = d.concepts.filter((c) => c.policies.length === 0)
const evByConcept = new Map<string, string[]>()
for (const e of d.events) for (const c of e.concepts ?? []) evByConcept.set(c, [...(evByConcept.get(c) ?? []), `${e.date} ${e.id} ${e.title}`])
const out: string[] = [`${d.concepts.length} concepts, ${empty.length} without policies`, '']
for (const c of empty) {
  out.push(`## ${c.id}  ${c.name}  [${c.kind}]${c.parent ? ` parent=${c.parent}` : ''}`)
  out.push(`summary: ${c.summary}`)
  if (c.first) out.push(`first: ${c.first.date} ${c.first.text} (${c.first.cite})`)
  for (const x of c.codified) out.push(`codified: ${x.date} ${x.where} (${x.cite})`)
  if (c.sections.length) out.push(`sections: ${c.sections.map((s) => s.h).join(' / ')}`)
  if (c.sides.length) out.push(`sides: ${c.sides.map((s) => s.label).join(' / ')}`)
  out.push(`cites: ${c.cites.join(', ')}`)
  for (const e of evByConcept.get(c.id) ?? []) out.push(`event: ${e}`)
  out.push('')
}
writeFileSync(join(ROOT, '.probe', 'LK3-concepts.txt'), out.join('\n'))
const ev = d.events.map((e) => `${e.date}\t${e.id}\t${e.lane}\t${e.title}\t${(e.concepts ?? []).join(',')}`).sort()
writeFileSync(join(ROOT, '.probe', 'LK3-events.txt'), ev.join('\n') + '\n')
console.log(d.concepts.length, empty.length, d.events.length)

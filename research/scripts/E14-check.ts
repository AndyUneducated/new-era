// E14: list every policy carrying an e14 event and flag same-date siblings (a sign the name did not match and the merge failed)
import { writeFileSync } from 'node:fs'
import { loadAll } from '../../tools/build/load.ts'

const { concepts } = loadAll()
const out: string[] = []
for (const c of concepts)
  for (const p of c.policies) {
    if (!p.events.some((e) => e.startsWith('e14-'))) continue
    const same = c.policies.filter((q) => String(q.date) === String(p.date)).length
    out.push(`${same > 1 ? 'DUP ' : ''}${c.id} | ${p.date} | ${p.name} | ${p.events.join(',')} | text=${p.text ? 'y' : 'EMPTY'} | ${p.cite}`)
  }
writeFileSync('.probe/e14-check.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

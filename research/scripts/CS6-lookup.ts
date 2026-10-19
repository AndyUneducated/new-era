// CS6 helper: for each id or name given, the sentence step, sum and the sources the site has for them.
// Run: node research/scripts/CS6-lookup.ts --batch=CS6 id-or-name ...   (writes .probe/CS6-lookup.txt)
import { mkdirSync, writeFileSync } from 'node:fs'
import { parseFall } from '../../src/lib/caseparse.ts'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const want = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const d = loadAll()
const out: string[] = []
for (const w of want) {
  const ps = d.people.filter((p) => p.id === w || p.name === w)
  if (!ps.length) {
    out.push(`${w}\t(no card)`)
    continue
  }
  for (const p of ps) {
    const rec = d.falls.get(p.id)
    const c = parseFall(p.fall, p.status, rec, (x) => d.texts.get(x.split('@')[0]))
    out.push(`${p.name}\t${p.id}\t${c.term ?? '-'}\t${c.years ?? ''}\t${c.yuan ?? ''}\t${c.sentenced ?? ''}`)
    if (rec?.amount) out.push(`  amount\t${rec.amount.text}\t${rec.amount.cite}`)
    if (rec?.sentence) out.push(`  sentence\t${rec.sentence.date}\t${rec.sentence.term}\t${rec.sentence.cite}`)
    for (const f of p.fall) out.push(`  step\t${f.date}\t${f.cite}\t${f.text.slice(0, 80)}`)
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'CS6-lookup.txt'), out.join('\n') + '\n')

// R11: the stored texts of several sources in one UTF-8 file, to read them together.
// Run: node research/scripts/R11-texts.ts <part> id1 id2 ... → .probe/R11-texts-<part>.txt
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'

const [part, ...ids] = process.argv.slice(2)
const out: string[] = []
for (const id of ids) {
  const f = path('sources', 'text', `${id}.txt`)
  out.push(`===== ${id}`)
  out.push(existsSync(f) ? readFileSync(f, 'utf8').replace(/\n{2,}/g, '\n').slice(0, 6000) : '(no text)')
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', `R11-texts-${part}.txt`), out.join('\n') + '\n')

// T02: concatenate the archived text of every T02 source into .probe/T02-dump.txt for card writing.
// CCDI expulsion notices carry a long boilerplate charge paragraph; --brief keeps only the first
// paragraph, the CV (简历) and court sentences, which is what the cards need.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SOURCES } from './T02-sources.ts'

const root = join(import.meta.dirname, '..', '..')
const brief = process.argv.includes('--brief')
const out: string[] = []
let total = 0
for (const s of SOURCES) {
  const p = join(root, 'sources/text', `${s.id}.txt`)
  if (!existsSync(p)) {
    out.push(`=== ${s.id} (${s.who}) NO TEXT`)
    continue
  }
  let paras = readFileSync(p, 'utf8').split(/\n+/).map((x) => x.trim()).filter(Boolean)
  if (brief) {
    const cv = paras.findIndex((x) => /简历$/.test(x))
    paras = paras.filter((x, i) => i === 0 || (cv >= 0 && i > cv) || /判处|宣判|开庭|逮捕|起诉|出生|曾任|历任|担任/.test(x))
  }
  const t = paras.join('\n')
  total += t.length
  out.push(`=== ${s.id} (${s.who}) ${s.date}\n${t}`)
}
writeFileSync(join(root, '.probe/T02-dump.txt'), out.join('\n\n'), 'utf8')
console.log(out.length, total)

// K05: a reading digest of the archived Wikipedia text for each person: the lead, plus every sentence that
// mentions an investigation, expulsion, removal or death.
//   node research/scripts/K05-digest.ts   -> .probe/K05-digest.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PEOPLE } from './K05-ids.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const reuse = JSON.parse(readFileSync(join(ROOT, '.probe', 'K05-reuse.json'), 'utf8')) as Record<string, string>
const FALL = /落马|调查|审查|开除|逝世|去世|病逝|身亡|罢免|处分|留党察看|撤销|判处|有期徒刑|无期|死缓|立案|双开|被查|失联|缺席/
const out: string[] = []
for (const [raw, id, q] of PEOPLE) {
  const src = reuse[id] ?? `k05-wiki-${id}`
  const f = join(ROOT, 'sources', 'text', `${src}.txt`)
  out.push(`### ${raw} ${id} ${q} [${src}]`)
  if (!existsSync(f)) {
    out.push('  (no text)')
    continue
  }
  const text = readFileSync(f, 'utf8').replace(/\[\d+\]/g, '').replace(/\n+/g, ' ')
  const name = raw.replace(/（.*?）/g, '')
  const at = Math.max(0, text.indexOf(`${name}（`))
  out.push('  ' + text.slice(at, at + 420))
  const hits = text.split(/(?<=[。；])/).filter((s) => FALL.test(s) && !text.slice(at, at + 420).includes(s.trim()))
  for (const s of [...new Set(hits)].slice(0, 6)) out.push('  ! ' + s.trim().slice(0, 220))
}
writeFileSync(join(ROOT, '.probe', 'K05-digest.txt'), out.join('\n') + '\n')

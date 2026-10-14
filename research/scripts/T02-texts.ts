// T02: check sources/text/t02-*.txt against T02-sources.ts: orphans (no source row), missing texts,
// texts that do not name the person, and very short texts. Writes .probe/T02-texts.txt.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SOURCES } from './T02-sources.ts'

const root = join(import.meta.dirname, '..', '..')
const dir = join(root, 'sources/text')
const ids = new Set(SOURCES.map((s) => s.id))
const out: string[] = []
for (const f of readdirSync(dir).filter((f) => f.startsWith('t02-'))) {
  if (!ids.has(f.replace(/\.txt$/, ''))) out.push(`ORPHAN\t${f}`)
}
for (const s of SOURCES) {
  const p = join(dir, `${s.id}.txt`)
  if (!existsSync(p)) {
    out.push(`MISSING\t${s.id}`)
    continue
  }
  const t = readFileSync(p, 'utf8')
  if (!t.includes(s.who)) out.push(`NONAME\t${s.id}\t${s.who}`)
  if (t.length < 120) out.push(`SHORT\t${s.id}\t${t.length}`)
}
writeFileSync(join(root, '.probe/T02-texts.txt'), out.join('\n') || 'ok', 'utf8')
console.log(out.length)

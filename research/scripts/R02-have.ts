// R02 one-off: every registered source whose title or keep names one of the 2015 people, with id, title and url.
//   node research/scripts/R02-have.ts   writes .probe/R02-have.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
import { NAMES } from './R02-names.ts'

const all: any[] = []
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))) {
  const m = parse(readFileSync(`research/manifests/${f}`, 'utf8')) ?? {}
  for (const s of m.web ?? []) all.push({ ...s, file: f })
}
const out: string[] = []
for (const n of NAMES) {
  out.push(`## ${n}`)
  for (const s of all) {
    if (!`${s.title} ${(s.keep ?? []).join(' ')}`.includes(n)) continue
    const txt = `sources/text/${s.id}.txt`
    const len = existsSync(txt) ? readFileSync(txt, 'utf8').length : 0
    out.push(`  ${s.id} [${s.voice}${s.excerpt ? ',ex' : ''}] ${s.title} (${s.date ?? ''}) len=${len}\n    ${s.url}`)
  }
}
writeFileSync('.probe/R02-have.txt', out.join('\n') + '\n', 'utf8')
console.log(`${all.length} sources`)

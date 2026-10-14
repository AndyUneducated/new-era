// T02: one line per Wikidata record (qid, label, born, birthplace) plus every id already used in content/people,
// written to .probe/T02-wd.txt so card ids can be checked for collisions.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const root = join(import.meta.dirname, '..', '..')
const out: string[] = []
const wdDir = join(root, 'research/wikidata')
for (const f of readdirSync(wdDir)) {
  if (!f.endsWith('.json')) continue
  const r = JSON.parse(readFileSync(join(wdDir, f), 'utf8'))
  out.push(`${r.qid}\t${r.label}\t${r.born ?? ''}\t${r.birthplace ?? ''}\t${r.description ?? ''}`)
}
const ids: string[] = []
for (const f of readdirSync(join(root, 'content/people'))) {
  if (f === 'T02.yaml' || !f.endsWith('.yaml')) continue
  const list = parse(readFileSync(join(root, 'content/people', f), 'utf8')) ?? []
  for (const p of list) ids.push(p.id)
}
out.push('', 'IDS ' + ids.sort().join(' '))
writeFileSync(join(root, '.probe/T02-wd.txt'), out.join('\n'), 'utf8')
console.log(out.length)

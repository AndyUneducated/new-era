// K04: which of my roster names have since been registered by another batch (research/roster.yaml,
// research/roster/*.yaml, content/people/*.yaml)? Also lists the ids already in use. Writes .probe/K04-taken.txt.
//   node research/scripts/K04-taken.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const picks = JSON.parse(readFileSync(join(ROOT, '.probe', 'K04-picks.json'), 'utf8')) as Record<string, { name: string }>
const mine = new Set(Object.values(picks).map((p) => p.name))
const hits: string[] = []
const ids: string[] = []
const scan = (file: string, list: { id?: string; name?: string; batch?: string }[]) => {
  for (const x of list ?? []) {
    if (x.id) ids.push(x.id)
    const n = (x.name ?? '').replace(/（[^）]*）$/, '')
    if (mine.has(n)) hits.push(`${n}\t${x.id}\t${file}`)
  }
}
scan('research/roster.yaml', parse(readFileSync(join(ROOT, 'research', 'roster.yaml'), 'utf8')))
for (const f of readdirSync(join(ROOT, 'research', 'roster'))) {
  if (f === 'K04.yaml' || !f.endsWith('.yaml')) continue
  scan(`research/roster/${f}`, parse(readFileSync(join(ROOT, 'research', 'roster', f), 'utf8')))
}
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  if (f === 'K04.yaml' || !f.endsWith('.yaml')) continue
  const doc = parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8'))
  scan(`content/people/${f}`, Array.isArray(doc) ? doc : (doc?.people ?? []))
}
writeFileSync(join(ROOT, '.probe', 'K04-taken.txt'), hits.join('\n') + '\n\n# ids\n' + [...new Set(ids)].sort().join('\n') + '\n')
console.log(hits.length, 'hits;', new Set(ids).size, 'ids')

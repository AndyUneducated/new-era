// LK3: quotes of 8+ characters in policy text must appear verbatim in the cited source; also tallies the batch.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { ROOT } from '../../tools/build/io.ts'

type Policy = { date: string; name: string; text: string; events: string[]; cite: string }
const more = parse(readFileSync(join(ROOT, 'content/concept-more/LK3.yaml'), 'utf8')) as Record<string, { policies: Policy[] }>
const out: string[] = []
let policies = 0
let links = 0
for (const [id, c] of Object.entries(more)) {
  out.push(`${id}\t${c.policies.length}\t${c.policies.reduce((n, p) => n + p.events.length, 0)}`)
  for (const p of c.policies) {
    policies++
    links += p.events.length
    const path = join(ROOT, 'sources/text', `${p.cite}.txt`)
    const src = existsSync(path) ? readFileSync(path, 'utf8') : ''
    if (!src) out.push(`  NO TEXT ${p.cite}`)
    for (const m of p.text.matchAll(/“([^”]+)”/g)) {
      if (m[1].length >= 8 && !src.includes(m[1])) out.push(`  MISSING ${id} ${p.date} ${m[1]}`)
    }
  }
}
out.push(`concepts ${Object.keys(more).length} policies ${policies} event links ${links}`)
writeFileSync(join(ROOT, '.probe/LK3-check.txt'), out.join('\n') + '\n')

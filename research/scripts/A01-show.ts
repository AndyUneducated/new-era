import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
const want = new Set(process.argv.slice(2))
const out = []
for (const f of readdirSync('content/people')) {
  if (!f.endsWith('.yaml')) continue
  for (const p of parse(readFileSync('content/people/' + f, 'utf8')) ?? []) {
    if (!want.has(p.id)) continue
    out.push(`## ${p.id} ${p.name} (${f}) status=${p.status} wd=${p.ids?.wikidata ?? ''}`)
    out.push(`statusNote: ${p.statusNote ?? ''}`)
    for (const s of p.fall ?? []) out.push(`  fall ${s.date} | ${s.text} | ${s.cite}`)
    out.push(`  cites: ${(p.cites ?? []).join(', ')}`)
    for (const t of p.factions ?? []) out.push(`  faction ${t.f} ${t.cite}`)
    for (const pos of (p.positions ?? []).slice(-3)) out.push(`  pos ${pos.title} ${pos.from ?? ''}-${pos.to ?? ''}`)
  }
}
writeFileSync('.probe/a01-existing.txt', out.join('\n'), 'utf8')

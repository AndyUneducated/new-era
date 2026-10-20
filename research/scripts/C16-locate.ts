// C16: where each pending case lives (card file, record file) and what steps it already has.
// node research/scripts/C16-locate.ts [id ...]  ->  .probe/c16-locate.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const list = readFileSync(join(ROOT, 'research/lists/R17-pending-cases.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const only = new Set(process.argv.slice(2))
const cards = new Map<string, { file: string; p: any }>()
for (const f of readdirSync(join(ROOT, 'content/people')).filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const p of parse(readFileSync(join(ROOT, 'content/people', f), 'utf8')) ?? []) cards.set(p.id, { file: f, p })
  } catch {}
}
const recs = new Map<string, { file: string; r: any }>()
for (const f of readdirSync(join(ROOT, 'content/falls')).filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const [id, r] of Object.entries(parse(readFileSync(join(ROOT, 'content/falls', f), 'utf8')) ?? {})) recs.set(id, { file: f, r })
  } catch {}
}
const out: string[] = []
for (const [id, name, outcome, sys, grade, last, blurb] of list) {
  if (only.size && !only.has(id)) continue
  if (!only.size && (sys === 'other' || sys === 'army')) continue
  const c = cards.get(id)
  const r = recs.get(id)
  out.push(`## ${id} ${name} ${outcome} ${sys}/${grade} ${last} | ${blurb}`)
  out.push(`card ${c?.file} status=${c?.p.status} note=${c?.p.statusNote ?? ''}`)
  for (const s of c?.p.fall ?? []) out.push(`  card ${s.date} ${s.text} [${s.cite}]`)
  out.push(`rec ${r?.file} keys=${Object.keys(r?.r ?? {}).join(',')} outcome=${r?.r.outcome ?? ''} status=${r?.r.status ?? ''}`)
  for (const s of r?.r.fall ?? []) out.push(`  rec ${s.date} ${s.text} [${s.cite}]`)
  out.push('')
}
writeFileSync(join(ROOT, '.probe/c16-locate.txt'), out.join('\n'))

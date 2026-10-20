// FX2: dumps the cards and case records of the people in research/lists/R18-status-audit.txt to .probe/fx2-dump.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import { parseFall } from '../../src/lib/caseparse.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const list = readFileSync(join(ROOT, 'research/lists/R18-status-audit.txt'), 'utf8')
const ids = [...list.matchAll(/^\s+([a-z0-9-]+)\t/gm)].map((m) => m[1])
const only = process.argv.slice(2)
const want = only.length ? ids.filter((i) => only.includes(i)) : ids

type Any = Record<string, any>
const people = new Map<string, { file: string; p: Any }>()
for (const f of readdirSync(join(ROOT, 'content/people')).filter((f) => f.endsWith('.yaml'))) {
  try {
    const data = parse(readFileSync(join(ROOT, 'content/people', f), 'utf8'))
    for (const p of (Array.isArray(data) ? data : []) as Any[]) if (p?.id) people.set(p.id, { file: f, p })
  } catch {}
}
const recs = new Map<string, { file: string; r: Any }[]>()
for (const f of readdirSync(join(ROOT, 'content/falls')).filter((f) => f.endsWith('.yaml'))) {
  try {
    const data = parse(readFileSync(join(ROOT, 'content/falls', f), 'utf8')) as Any
    for (const [k, r] of Object.entries(data ?? {})) recs.set(k, [...(recs.get(k) ?? []), { file: f, r: r as Any }])
  } catch {}
}
const out: string[] = []
for (const id of want) {
  const c = people.get(id)
  out.push(`=== ${id} ${c?.p.name} [${c?.file}] status=${c?.p.status} died=${c?.p.died ?? ''} born=${c?.p.born ?? ''}`)
  out.push(`  note: ${c?.p.statusNote ?? ''}`)
  out.push(`  roles: ${(c?.p.roles ?? []).join(',')}  headline: ${c?.p.headline}`)
  out.push(`  cites: ${(c?.p.cites ?? []).join(' ')}`)
  for (const s of c?.p.fall ?? []) out.push(`  - ${s.date} | ${s.text} | ${s.cite}`)
  const allFall = [...(c?.p.fall ?? [])]
  for (const { file, r } of recs.get(id) ?? []) {
    out.push(`  REC [${file}] sys=${r.sys} grade=${r.grade} outcome=${r.outcome ?? ''} status=${r.status ?? ''} sentence=${JSON.stringify(r.sentence ?? '')}`)
    if (r.statusNote) out.push(`    recnote: ${r.statusNote}`)
    for (const s of r.fall ?? []) out.push(`    + ${s.date} | ${s.text} | ${s.cite}`)
    allFall.push(...(r.fall ?? []))
  }
  const pr = parseFall(allFall.map((s) => ({ ...s, date: String(s.date) })), c?.p.status ?? '', recs.get(id)?.[0]?.r)
  out.push(`  PARSED term=${pr.term ?? ''} years=${pr.years ?? ''} sentenced=${pr.sentenced ?? ''} outcome=${pr.outcome} steps=${pr.steps.map((s) => s.kind).join(',')}`)
}
writeFileSync(join(ROOT, '.probe/fx2-dump.txt'), out.join('\n') + '\n')
console.log(want.length)

// Lists the sitting provincial party secretaries (chiefs rows with post: sec and no `to`), the card found for each
// (by person id or by name), whether a turns record exists, and every registered source whose title or id mentions
// the person, with the size of its stored text.
//   node research/scripts/U07-list.ts   -> .probe/U07-list.txt
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Chief = { prov: string; post: string; name: string; person?: string; from: string; to?: string; cite: string }
type P = { id: string; name: string; tier: number; headline: string; born?: string; cites: string[] }
type S = { id: string; title: string; url: string; voice: string; excerpt?: boolean }
const chiefs: Chief[] = []
for (const f of ['P01.yaml', 'P02.yaml']) chiefs.push(...((parse(readFileSync(join(ROOT, 'content', 'chiefs', f), 'utf8')) ?? []) as Chief[]))
const people = new Map<string, P & { file: string }>()
const byName = new Map<string, string[]>()
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  for (const p of (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as P[]) {
    people.set(p.id, { ...p, file: f })
    byName.set(p.name, [...(byName.get(p.name) ?? []), p.id])
  }
}
const turns = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content', 'turns'))) for (const id of Object.keys(parse(readFileSync(join(ROOT, 'content', 'turns', f), 'utf8')) ?? {})) turns.set(id, f)
const sources: S[] = []
for (const f of readdirSync(join(ROOT, 'research', 'manifests')).filter((f) => f.endsWith('.yaml'))) {
  try {
    sources.push(...(((parse(readFileSync(join(ROOT, 'research', 'manifests', f), 'utf8')) as { web?: S[] } | null)?.web ?? []) as S[]))
  } catch {}
}
const size = (id: string) => {
  const p = join(ROOT, 'sources', 'text', `${id}.txt`)
  return existsSync(p) ? statSync(p).size : -1
}
const out: string[] = []
for (const c of chiefs.filter((c) => c.post === 'sec' && !c.to)) {
  const ids = c.person ? [c.person] : (byName.get(c.name) ?? [])
  out.push(`${c.prov}\t${c.name}\tperson=${c.person ?? '-'}\tbyName=${(byName.get(c.name) ?? []).join(',') || '-'}\tfrom=${c.from}\tturns=${ids.map((i) => turns.get(i) ?? '-').join(',')}`)
  for (const id of ids) {
    const p = people.get(id)
    if (!p) continue
    out.push(`  ${p.id} [${p.file}] tier ${p.tier} born ${p.born ?? '?'} :: ${p.headline}`)
    const tail = id.split('-').slice(1).join('-')
    const hits = sources.filter((s) => s.title.includes(c.name) || s.id.includes(id) || (tail.length > 3 && s.id.includes(`-${id.split('-')[0]}-${tail}`)))
    for (const s of hits) out.push(`    ${s.id} [${s.voice}${s.excerpt ? ' ex' : ''}] ${size(s.id)}b :: ${s.title}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'U07-list.txt'), out.join('\n') + '\n')
console.log(out.length)

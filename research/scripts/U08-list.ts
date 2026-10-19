// Lists the sitting heads of government of the 31 provinces (chiefs rows with post: gov and no `to`), whether a
// person card exists (by id or by name), whether a turns record exists, and the card's positions and cites.
//   node research/scripts/U08-list.ts   -> .probe/U08-list.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Chief = { prov: string; post: string; name: string; person?: string; from: string; to?: string; acting?: boolean; cite: string }
type P = { id: string; name: string; tier: number; headline: string; born?: string; cites: string[]; positions?: { title: string; from?: string; to?: string; cite?: string }[]; life?: { h: string; cites: string[] }[] }
const chiefs: Chief[] = []
for (const f of ['P01.yaml', 'P02.yaml']) chiefs.push(...((parse(readFileSync(join(ROOT, 'content', 'chiefs', f), 'utf8')) ?? []) as Chief[]))
const people = new Map<string, P & { file: string }>()
const byName = new Map<string, string[]>()
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  const doc = (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as P[]
  for (const p of doc) {
    people.set(p.id, { ...p, file: f })
    byName.set(p.name, [...(byName.get(p.name) ?? []), p.id])
  }
}
const turns = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content', 'turns'))) {
  const doc = parse(readFileSync(join(ROOT, 'content', 'turns', f), 'utf8')) ?? {}
  for (const id of Object.keys(doc)) turns.set(id, f)
}
const out: string[] = []
for (const c of chiefs.filter((c) => c.post === 'gov' && !c.to)) {
  const ids = c.person ? [c.person] : (byName.get(c.name) ?? [])
  out.push(`${c.prov}\t${c.name}\tperson=${c.person ?? '-'}\tbyName=${(byName.get(c.name) ?? []).join(',') || '-'}\tfrom=${c.from}${c.acting ? ' acting' : ''}\tturns=${ids.map((i) => turns.get(i) ?? '-').join(',')}\tcite=${c.cite}`)
  for (const id of ids) {
    const p = people.get(id)
    if (!p) continue
    out.push(`  ${p.id} [${p.file}] tier ${p.tier} born ${p.born ?? '?'} :: ${p.headline}`)
    out.push(`  cites: ${p.cites.join(' ')}`)
    for (const x of p.positions ?? []) out.push(`    ${x.from ?? ''}–${x.to ?? ''} ${x.title} [${x.cite ?? ''}]`)
    for (const l of p.life ?? []) out.push(`    life: ${l.h} [${l.cites.join(' ')}]`)
  }
}
writeFileSync(join(ROOT, '.probe', 'U08-list.txt'), out.join('\n') + '\n')
console.log(out.length)

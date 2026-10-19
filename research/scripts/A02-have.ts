// Lists every person card that looks like an army officer (roles general/cmc, an army post, or 军/武警 in the
// headline), with status, headline and fall steps, and whether a case record exists anywhere.
//   node research/scripts/A02-have.ts   -> .probe/A02-have.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type P = { id: string; name: string; roles: string[]; status: string; statusNote?: string; headline: string; fall?: { date: string; text: string; cite: string }[]; positions?: { sys?: string }[] }
const cases = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content', 'falls'))) {
  const doc = parse(readFileSync(join(ROOT, 'content', 'falls', f), 'utf8')) ?? {}
  for (const id of Object.keys(doc)) cases.set(id, f)
}
const out: string[] = []
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  const doc = (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as P[]
  for (const p of doc) {
    const army = p.roles?.some((r) => r === 'general' || r === 'cmc') || p.positions?.some((x) => x.sys === 'army') || /军|武警|国防/.test(p.headline ?? '')
    if (!army) continue
    out.push(`${p.id}\t${p.name}\t${f}\t${p.status}\t${cases.get(p.id) ?? '-'}\t${p.headline}\t${p.statusNote ?? ''}`)
    for (const s of p.fall ?? []) out.push(`    ${s.date} ${s.text} [${s.cite}]`)
  }
}
writeFileSync(join(ROOT, '.probe', 'A02-have.txt'), out.join('\n') + '\n')
console.log(out.length)

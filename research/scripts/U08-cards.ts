// Prints the cards named on the command line (by id or name): headline, status, fall steps, positions and cites.
//   node research/scripts/U08-cards.ts id-or-name ...   -> .probe/U08-cards-<n>.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type P = { id: string; name: string; status: string; headline: string; bio: string; cites: string[]; fall?: { date: string; text: string; cite: string }[]; positions?: { title: string; from?: string; to?: string; cite?: string }[] }
const want = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const tag = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? 'x'
const out: string[] = []
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  for (const p of (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as P[]) {
    if (!want.includes(p.id) && !want.includes(p.name)) continue
    out.push(`## ${p.id} ${p.name} [${f}] ${p.status} :: ${p.headline}`)
    out.push(`  bio: ${p.bio}`)
    out.push(`  cites: ${p.cites.join(' ')}`)
    for (const s of p.fall ?? []) out.push(`  fall ${s.date} ${s.text} [${s.cite}]`)
    for (const x of p.positions ?? []) out.push(`  pos ${x.from ?? ''}–${x.to ?? ''} ${x.title} [${x.cite ?? ''}]`)
  }
}
writeFileSync(join(ROOT, '.probe', `U08-cards-${tag}.txt`), out.join('\n') + '\n')
console.log(out.length)

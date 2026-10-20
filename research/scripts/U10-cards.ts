// U10: print full cards (bio, positions, cites, born) for the ids given, with each cite's manifest url and archived text size
import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { parse } from 'yaml'

const root = new URL('../../', import.meta.url)
const people = new Map<string, any>()
for (const f of readdirSync(new URL('content/people/', root))) {
  if (!f.endsWith('.yaml')) continue
  for (const p of parse(readFileSync(new URL('content/people/' + f, root), 'utf8')) ?? []) if (p?.id) people.set(p.id, { ...p, file: f })
}
const src = new Map<string, any>()
for (const f of readdirSync(new URL('research/manifests/', root))) {
  if (!f.endsWith('.yaml')) continue
  const m = parse(readFileSync(new URL('research/manifests/' + f, root), 'utf8')) ?? {}
  for (const s of m.web ?? []) if (s?.id) src.set(s.id, s)
}
const out: string[] = []
for (const id of process.argv.slice(2)) {
  const p = people.get(id)
  if (!p) { out.push(`## ${id}: NO CARD`); continue }
  out.push(`## ${id} ${p.name} [${p.file}] born=${p.born ?? ''} ${p.birthplace ?? ''} eth=${p.ethnicity ?? ''} status=${p.status}`)
  out.push('  bio: ' + String(p.bio ?? '').replace(/\s+/g, ' '))
  for (const x of p.positions ?? []) out.push(`  - ${x.title}${x.place ? '@' + x.place : ''} ${x.from ?? ''}–${x.to ?? ''} [${x.cite ?? ''}]`)
  const cites = new Set<string>([...(p.cites ?? []), ...(p.positions ?? []).map((x: any) => x.cite).filter(Boolean)])
  for (const c of cites) {
    const s = src.get(c)
    const t = new URL(`sources/text/${c}.txt`, root)
    const size = existsSync(t) ? statSync(t).size : 0
    out.push(`  cite ${c}: ${s?.voice ?? ''} ${s?.url ?? (c.startsWith('wd-') ? 'wikidata' : '?')} text=${size}`)
  }
}
writeFileSync(new URL('.probe/U10-cards.txt', root), out.join('\n'))

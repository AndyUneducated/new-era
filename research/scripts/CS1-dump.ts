// CS1: dump every person card (id, name, headline, file, status) and the case records of a few people
// usage: node research/scripts/CS1-dump.ts [id ...]
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const root = new URL('../..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1')
const inflight: string[] = parse(readFileSync(join(root, 'research/round.yaml'), 'utf8')).inflight
const dir = (d: string) => readdirSync(join(root, d)).filter((f) => f.endsWith('.yaml'))
const lines: string[] = []
const people = new Map<string, any>()
for (const f of dir('content/people')) {
  const skip = inflight.some((b) => b !== 'CS1' && f.startsWith(b))
  for (const p of parse(readFileSync(join(root, 'content/people', f), 'utf8')) ?? []) {
    lines.push([p.id, p.name, p.status, p.headline ?? '', f + (skip ? ' (inflight)' : '')].join('\t'))
    if (!skip) people.set(p.id, { ...p, file: f })
  }
}
mkdirSync(join(root, '.probe'), { recursive: true })
writeFileSync(join(root, '.probe/cs1-people.tsv'), lines.join('\n'), 'utf8')

const want = process.argv.slice(2)
if (want.length) {
  const falls = new Map<string, any>()
  for (const f of dir('content/falls')) {
    const skip = inflight.some((b) => b !== 'CS1' && f.startsWith(b))
    for (const [id, c] of Object.entries(parse(readFileSync(join(root, 'content/falls', f), 'utf8')) ?? {})) falls.set(id, { ...(c as any), file: f + (skip ? ' (inflight)' : '') })
  }
  const out: string[] = []
  for (const id of want) {
    const p = people.get(id)
    out.push(`######## ${id} ${p ? `${p.name} [${p.file}]` : '(no integrated card)'}`)
    if (p) {
      out.push(`headline: ${p.headline}\nbio: ${p.bio}\nstatus: ${p.status} ${p.statusNote ?? ''}`)
      for (const s of p.fall ?? []) out.push(`  fall ${s.date} ${s.text} [${s.cite}]`)
      for (const s of p.life ?? []) out.push(`  life ${s.h} ${s.from ?? ''}-${s.to ?? ''}: ${s.text} [${s.cites.join(', ')}]`)
      for (const s of p.assess ?? []) out.push(`  assess ${s.voice}: ${s.text} [${s.cite}]`)
      for (const s of p.factions ?? []) out.push(`  faction ${s.f}: ${s.quote ?? ''} [${s.cite}]`)
      out.push(`  cites: ${(p.cites ?? []).join(', ')}`)
    }
    const c = falls.get(id)
    if (c) out.push('  CASE ' + JSON.stringify(c, null, 1).replace(/\n\s*/g, ' '))
  }
  writeFileSync(join(root, '.probe/cs1-dump.txt'), out.join('\n'), 'utf8')
}

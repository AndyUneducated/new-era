// CS2: dump existing cards and fall records for people matching names or headline keywords, to .probe/CS2-<tag>.txt
// usage: node research/scripts/CS2-probe.ts <tag> <regex on name|headline|bio>
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { parse } from 'yaml'

const [tag, pat, mode] = process.argv.slice(2)
const re = new RegExp(pat)
const out: string[] = []
const people = readdirSync('content/people').filter((f) => f.endsWith('.yaml'))
const falls = new Map<string, { file: string; rec: unknown }>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml'))) {
  const m = parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}
  for (const [id, rec] of Object.entries(m)) falls.set(id, { file: f, rec })
}
for (const f of people) {
  const list = parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []
  for (const p of list) {
    const hay = mode === 'name' ? p.name : `${p.name} ${p.headline ?? ''} ${p.bio ?? ''}`
    if (!re.test(hay)) continue
    out.push(`=== ${p.id} ${p.name} [${f}] tier ${p.tier} status ${p.status}`)
    out.push(`headline: ${p.headline}`)
    out.push(`bio: ${p.bio}`)
    for (const s of p.fall ?? []) out.push(`fall ${s.date}: ${s.text} [${s.cite}]`)
    if (mode !== 'short') {
      for (const s of p.life ?? []) out.push(`life ${s.h} ${s.from}–${s.to}: ${s.text} [${s.cites}]`)
      for (const s of p.assess ?? []) out.push(`assess ${s.voice}: ${s.text} [${s.cite}]`)
      for (const s of p.factions ?? []) out.push(`faction ${s.f}: ${s.quote} [${s.cite}]`)
      out.push(`cites: ${p.cites}`)
    }
    const c = falls.get(p.id)
    if (c) out.push(`CASE [${c.file}]: ${JSON.stringify(c.rec, null, 1)}`)
    out.push('')
  }
}
mkdirSync('.probe', { recursive: true })
writeFileSync(`.probe/CS2-${tag}.txt`, out.join('\n'), 'utf8')
console.log(out.filter((l) => l.startsWith('===')).length, 'people')

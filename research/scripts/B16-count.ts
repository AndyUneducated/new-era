import fs from 'node:fs'
import { parse } from 'yaml'

const people = parse(fs.readFileSync('content/people/B16.yaml', 'utf8')) as any[]
const quotes = parse(fs.readFileSync('content/quotes/B16.yaml', 'utf8')) as Record<string, any[]>
const manifests = fs.readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))
const voice = new Map<string, string>()
for (const f of manifests) {
  const m = parse(fs.readFileSync(`research/manifests/${f}`, 'utf8')) as any
  for (const e of m?.web ?? []) voice.set(e.id, e.voice + (e.rumor ? '(rumor)' : ''))
}
const han = (s: string) => (s.match(/[\u3400-\u9fff]/g) ?? []).length
const out: string[] = []
for (const p of people) {
  const parts = [p.bio, ...(p.life ?? []).map((l: any) => l.text), ...(p.assess ?? []).map((a: any) => a.zh ?? a.text), ...(p.family ?? []).map((f: any) => f.text)]
  const all = parts.join('')
  const ids = new Set<string>([...(p.cites ?? []), ...(p.positions ?? []).map((x: any) => x.cite), ...(p.life ?? []).flatMap((l: any) => l.cites), ...(p.assess ?? []).map((a: any) => a.cite), ...(p.factions ?? []).map((f: any) => f.cite), ...(quotes[p.id] ?? []).map((q: any) => q.cite)])
  const vs: Record<string, number> = {}
  for (const id of ids) {
    const v = id.startsWith('wd-') ? 'wikidata' : voice.get(id) ?? '?'
    vs[v] = (vs[v] ?? 0) + 1
  }
  out.push(`${p.id}: han=${han(all)} chars=${all.length} bio=${han(p.bio)} life=${p.life.length} [${p.life.map((l: any) => han(l.text)).join(',')}] assess=${p.assess.length} quotes=${(quotes[p.id] ?? []).length} sources=${ids.size} ${JSON.stringify(vs)}`)
}
fs.writeFileSync('.probe/b16-count.txt', out.join('\n'))

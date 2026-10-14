// one-off: character counts and source tallies for the B20 biographies
import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const people = parse(readFileSync('content/people/B20.yaml', 'utf8')) as any[]
const quotes = parse(readFileSync('content/quotes/B20.yaml', 'utf8')) as Record<string, any[]>
const manifests = ['B20', 'C01', 'K01', 'K03', 'K06', 'E02', 'B02', 'B19', 'B21', 'B13', 'B08', 'C02', 'F10', 'V01']
const voice = new Map<string, string>()
for (const m of manifests) {
  try {
    const doc = parse(readFileSync(`research/manifests/${m}.yaml`, 'utf8'))
    for (const list of Object.values(doc ?? {}))
      if (Array.isArray(list)) for (const s of list as any[]) if (s?.id) voice.set(s.id, s.voice + (s.rumor ? '(rumor)' : ''))
  } catch {}
}
const len = (s?: string) => (s ?? '').replace(/\s+/g, '').length
const out: string[] = []
for (const p of people) {
  const bio = len(p.bio)
  const life = (p.life ?? []).map((l: any) => len(l.text))
  const assess = (p.assess ?? []).reduce((n: number, a: any) => n + len(a.zh ?? a.text), 0)
  const family = (p.family ?? []).reduce((n: number, f: any) => n + len(f.text), 0)
  const total = bio + life.reduce((a: number, b: number) => a + b, 0) + assess + family
  const ids = new Set<string>([...(p.cites ?? [])])
  for (const l of p.life ?? []) for (const c of l.cites ?? []) ids.add(c)
  for (const a of p.assess ?? []) ids.add(a.cite)
  for (const f of p.family ?? []) for (const c of f.cites ?? []) ids.add(c)
  for (const x of p.positions ?? []) ids.add(x.cite)
  for (const x of p.factions ?? []) ids.add(x.cite)
  for (const q of quotes[p.id] ?? []) ids.add(q.cite)
  const voices: Record<string, number> = {}
  for (const id of ids) {
    const v = id.startsWith('wd-') ? 'wikidata' : voice.get(id) ?? '?'
    voices[v] = (voices[v] ?? 0) + 1
  }
  out.push(`${p.id}: total ${total} (bio ${bio}, life ${life.join('/')}, assess ${assess}, family ${family}); quotes ${(quotes[p.id] ?? []).length}; sources ${ids.size} ${JSON.stringify(voices)}`)
}
writeFileSync('.probe/b20-count.txt', out.join('\n') + '\n')

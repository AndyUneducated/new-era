// One-off: per-person character, source and voice counts for the B19 report.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const voice = new Map<string, string>()
for (const f of readdirSync('research/manifests')) {
  if (!f.endsWith('.yaml')) continue
  const m = parse(readFileSync(`research/manifests/${f}`, 'utf8')) ?? {}
  for (const s of m.web ?? []) voice.set(s.id, s.rumor ? `${s.voice}(rumor)` : s.voice)
}
const people = parse(readFileSync('content/people/B19.yaml', 'utf8'))
const quotes = parse(readFileSync('content/quotes/B19.yaml', 'utf8'))
const strip = (s = '') => s.replace(/\s/g, '').length
const out: string[] = []
for (const p of people) {
  let n = strip(p.bio)
  for (const l of p.life ?? []) n += strip(l.text)
  for (const a of p.assess ?? []) n += strip(a.zh ?? a.text)
  for (const f of p.family ?? []) n += strip(f.text)
  const ids = new Set<string>(p.cites ?? [])
  for (const l of p.life ?? []) for (const c of l.cites ?? []) ids.add(c)
  for (const a of p.assess ?? []) ids.add(a.cite)
  for (const f of p.family ?? []) for (const c of f.cites ?? []) ids.add(c)
  for (const t of p.factions ?? []) ids.add(t.cite)
  for (const q of quotes[p.id] ?? []) ids.add(q.cite)
  const voices: Record<string, number> = {}
  for (const id of ids) {
    const v = id.startsWith('wd-') ? 'wikidata' : (voice.get(id) ?? '?')
    voices[v] = (voices[v] ?? 0) + 1
  }
  const lifeLens = (p.life ?? []).map((l: { text: string }) => strip(l.text)).join('/')
  out.push(`${p.id}\tchars=${n}\tbio=${strip(p.bio)}\tlife=${lifeLens}\tsources=${ids.size}\tquotes=${(quotes[p.id] ?? []).length}\t${JSON.stringify(voices)}`)
}
writeFileSync('.probe/b19-count.txt', out.join('\n') + '\n')

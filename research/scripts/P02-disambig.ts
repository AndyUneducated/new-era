// One-off: dump the wikitext of zh.wikipedia disambiguation pages, to pick the right P02 biography.
// Usage: node research/scripts/P02-disambig.ts   (titles from .probe/p02-disambig.txt, output .probe/p02-disambig-out.txt)
import { readFileSync, writeFileSync } from 'node:fs'

const titles = readFileSync('.probe/p02-disambig.txt', 'utf8').split(/\s+/).filter(Boolean)
const url = `https://zh.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&redirects=1&titles=${encodeURIComponent(titles.join('|'))}`
const res = await fetch(url, { headers: { 'User-Agent': 'new-era-research/1.0 (one-off lookup)' } })
const body = await res.text()
const j = JSON.parse(body) as { query: { pages: Record<string, { title: string; revisions?: { slots: { main: { '*': string } } }[] }> } }
const out: string[] = []
for (const p of Object.values(j.query.pages))
  out.push(`=== ${p.title}`, ...(p.revisions?.[0].slots.main['*'] ?? 'NONE').split('\n').filter((l) => l.startsWith('*') || l.startsWith('#')))
writeFileSync('.probe/p02-disambig-out.txt', out.join('\n') + '\n')
console.log(out.length)

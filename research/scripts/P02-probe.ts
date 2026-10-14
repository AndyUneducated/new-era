// One-off: check zh.wikipedia titles (existence, redirects, disambiguation pages) for the P02 biographies.
// Usage: node research/scripts/P02-probe.ts   (titles from .probe/p02-titles.txt, results in .probe/p02-probe.txt)
import { readFileSync, writeFileSync } from 'node:fs'

const titles = readFileSync('.probe/p02-titles.txt', 'utf8').split(/\s+/).filter(Boolean)
type Page = { title: string; missing?: string; pageprops?: { disambiguation?: string } }
const out: string[] = []
for (let i = 0; i < titles.length; i += 40) {
  const batch = titles.slice(i, i + 40)
  const url = `https://zh.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageprops&ppprop=disambiguation&titles=${encodeURIComponent(batch.join('|'))}`
  const res = await fetch(url, { headers: { 'User-Agent': 'new-era-research/1.0' } })
  const j = (await res.json()) as { query: { pages: Record<string, Page>; redirects?: { from: string; to: string }[] } }
  for (const r of j.query.redirects ?? []) out.push(`REDIRECT ${r.from} -> ${r.to}`)
  for (const p of Object.values(j.query.pages)) out.push(`${p.missing !== undefined ? 'MISSING' : p.pageprops?.disambiguation !== undefined ? 'DISAMBIG' : 'OK'} ${p.title}`)
}
writeFileSync('.probe/p02-probe.txt', out.join('\n') + '\n')
console.log(out.length)

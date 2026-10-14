// P01 one-off: full-text search of zh.wikipedia titles; usage: node research/scripts/P01-search.ts <out> <query> ...
import { writeFileSync } from 'node:fs'

const [out, ...qs] = process.argv.slice(2)
const lines: string[] = []
for (const q of qs) {
  const url = `https://zh.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=20&srsearch=${encodeURIComponent(q)}`
  const j = (await (await fetch(url, { headers: { 'User-Agent': 'new-era-research/0.1' } })).json()) as any
  lines.push(`## ${q}`)
  for (const s of j.query.search) lines.push(`${s.title}  | ${String(s.snippet).replace(/<[^>]+>/g, '').slice(0, 120)}`)
}
writeFileSync(`.probe/${out}`, lines.join('\n') + '\n')

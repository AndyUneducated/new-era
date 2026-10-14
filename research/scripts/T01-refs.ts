// T01 one-off: list the external reference links of the saved wiki list page whose titles mention a candidate.
// Input .probe/T01-probe-wikilist.txt (from T01-probe.ts --links); output .probe/T01-refs.txt
import { readFileSync, writeFileSync } from 'node:fs'

const lines = readFileSync('.probe/T01-probe-wikilist.txt', 'utf8').split('\n---\n')[0].split('\n')
const links = lines.map((l) => l.split('\t')).filter(([, h]) => h && /^https?:/.test(h) && !/wikipedia|wikimedia|wikidata|mediawiki/.test(h))
const names = readFileSync('research/scripts/T01-candidates.txt', 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('#'))
const out: string[] = []
for (const n of names) {
  const hits = links.filter(([t]) => t.replace(/\s+/g, '').includes(n))
  out.push(`## ${n}`, ...hits.map(([t, h]) => `  ${t}\t${h}`))
}
writeFileSync('.probe/T01-refs.txt', out.join('\n') + '\n', 'utf8')

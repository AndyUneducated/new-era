// T01 one-off: pull the rows for the T01 candidates out of a saved copy of the zh.wikipedia list
// "中共十八大至十九大期间落马官员列表" (an index for finding official notices, not a cited source).
// Usage: node research/scripts/T01-wikirows.ts <saved page.txt>
import { readFileSync, writeFileSync } from 'node:fs'

const page = readFileSync(process.argv[2], 'utf8').split(/\r?\n/)
const names = readFileSync('research/scripts/T01-candidates.txt', 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('#'))
const squash = (s: string) => s.replace(/\s+/g, '')
const out: string[] = []
for (const n of names) {
  const rows = page.filter((l) => l.startsWith('|') && squash(l.split('|')[1] ?? '') === n)
  out.push(rows.length ? rows.map((r) => r.replace(/\s*\[\d+\]/g, '')).join('\n') : `| ${n} | (not in list)`)
}
writeFileSync('.probe/T01-wikirows.txt', out.join('\n') + '\n', 'utf8')

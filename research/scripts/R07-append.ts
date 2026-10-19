// R07: append the picked rows (.probe/R07-pick.txt, comments dropped) to research/scripts/R07-src.txt, skipping
// who|kind pairs already there and mislabelled wiki-ref trial rows; `who|kind|url` args override a pick's URL,
// `who|kind|-` drops it.   node research/scripts/R07-append.ts ["who|kind|url" ...]
import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'research/scripts/R07-src.txt'
const have = new Set(
  readFileSync(SRC, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('|').slice(0, 2).join('|')),
)
const over = new Map(process.argv.slice(2).map((a) => [a.split('|').slice(0, 2).join('|'), a.split('|').slice(2).join('|')]))
const add: string[] = []
for (const l of readFileSync('.probe/R07-pick.txt', 'utf8').split('\n')) {
  if (!l || l.startsWith('#')) continue
  if (/\|trial\|/.test(l) && /# wiki-ref/.test(l)) continue
  const row = l.replace(/\s+# wiki-ref$/, '').split('|')
  const k = row.slice(0, 2).join('|')
  if (have.has(k)) continue
  const o = over.get(k)
  if (o === '-') continue
  if (o) {
    const [url, date] = o.split('@')
    row[3] = url
    if (date) row[2] = date
  }
  add.push(row.join('|'))
  have.add(k)
}
for (const [k, o] of over) if (!have.has(k) && o !== '-') add.push(`${k}|${o.split('@')[1] ?? ''}|${o.split('@')[0]}|${k.split('|')[0]} ${k.split('|')[1]}`)
writeFileSync(SRC, readFileSync(SRC, 'utf8').replace(/\n*$/, '\n') + add.join('\n') + '\n')
console.log(add.length)

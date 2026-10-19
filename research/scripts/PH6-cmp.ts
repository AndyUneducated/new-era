// Side by side: our headline (from .probe/PH6-list.txt) and the Baike card description for rows with a lead image,
// for picking the cards that are the same person. Writes .probe/PH6-cmp.txt.
//   node research/scripts/PH6-cmp.ts [from] [to]
import { readFileSync, writeFileSync } from 'node:fs'

const [from, to] = [Number(process.argv[2] ?? 1), Number(process.argv[3] ?? 1e9)]
const heads = new Map(
  readFileSync('.probe/PH6-list.txt', 'utf8')
    .split('\n')
    .map((l) => l.match(/^- ([a-z0-9-]+) \S+?（(.*?)）\[/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => [m[1], m[2]] as const),
)
const rows = readFileSync('.probe/PH6-cards.tsv', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split('\t'))
  .filter((c) => Number(c[0]) >= from && Number(c[0]) <= to)
const out = rows.map((c) => {
  const [n, id, name, , desc, abs, image, size] = c
  const mark = /\/pic\//.test(image ?? '') ? `IMG ${size}` : 'noimg'
  return `${n} ${id} ${name} | ${heads.get(id)?.slice(0, 40)} | ${desc?.slice(0, 40)} | ${abs?.slice(0, 50)} | ${mark}`
})
writeFileSync('.probe/PH6-cmp.txt', out.join('\n') + '\n')
console.log(out.length)

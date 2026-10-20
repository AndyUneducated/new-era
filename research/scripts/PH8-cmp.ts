// Side by side: our headline (research/lists/R15-no-photo.txt) and the Baike card description, for picking the
// cards that are the same person. Writes .probe/PH8-cmp.txt.
//   node research/scripts/PH8-cmp.ts [from] [to]
import { readFileSync, writeFileSync } from 'node:fs'

const [from, to] = [Number(process.argv[2] ?? 1), Number(process.argv[3] ?? 1e9)]
const heads = new Map(
  readFileSync('research/lists/R15-no-photo.txt', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t'))
    .map((c) => [c[0], `${c[3]} ${c[4]}`] as const),
)
const rows = readFileSync('.probe/PH8-cards.tsv', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split('\t'))
  .filter((c) => Number(c[0]) >= from && Number(c[0]) <= to)
const out = rows.map((c) => {
  const [n, id, name, , desc, abs, image, size] = c
  const mark = /\/pic\//.test(image ?? '') ? `IMG ${size}` : 'noimg'
  return `${n} ${id} ${name} | ${heads.get(id)?.slice(0, 50)} | ${desc?.slice(0, 40)} | ${abs?.slice(0, 60)} | ${mark}`
})
writeFileSync('.probe/PH8-cmp.txt', out.join('\n') + '\n')
console.log(out.length)

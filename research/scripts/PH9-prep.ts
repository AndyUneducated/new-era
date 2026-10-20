// PH9 work lists: the people on research/lists/R15-photo-next.txt with their Baike card (from PH8's
// .probe/PH8-cards.tsv), and the rank4 rows of research/lists/R15-no-photo.txt that PH8 did not touch.
// Writes .probe/PH9-list.txt and .probe/PH9-rest.txt.
//   node research/scripts/PH9-prep.ts
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const rows = readFileSync('research/lists/R15-no-photo.txt', 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l, i) => [String(i + 1), ...l.replace(/\r$/, '').split('\t')])
const byId = new Map(rows.map((r) => [r[1], r]))
const cards = new Map(
  readFileSync('.probe/PH8-cards.tsv', 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => l.replace(/\r$/, '').split('\t'))
    .map((c) => [c[1], c] as const),
)
const ph8 = new Set(Object.keys(parse(readFileSync('content/photos/PH8.yaml', 'utf8')) ?? {}))
const files = new Set(readdirSync('public/photos').map((f) => f.replace(/\.\w+$/, '')))
const nextLines = readFileSync('research/lists/R15-photo-next.txt', 'utf8').split('\n').map((l) => l.trim()).filter(Boolean)
const next = nextLines.filter((l) => !l.startsWith('#')).map((l) => l.split('=')[0])
const excluded = nextLines.filter((l) => l.startsWith('#')).map((l) => l.split(' ')[3])
const touched = new Set([...next, ...excluded])

const line = (id: string) => {
  const r = byId.get(id) ?? []
  const c = cards.get(id) ?? []
  const [, , , , desc, , image, size] = c
  const mark = /\/pic\//.test(image ?? '') ? `IMG ${size}` : 'noimg'
  return `${r[0]} ${id} ${r[2]} | ${r[4]?.slice(0, 60)} ${r[5]} | ${desc?.slice(0, 50)} | ${mark}${files.has(id) ? ' HASFILE' : ''}`
}
writeFileSync('.probe/PH9-list.txt', [...new Set(next)].map(line).join('\n') + '\n')
const rest = rows.filter((r) => /rank4/.test(r[5] ?? '') && !ph8.has(r[1]) && !touched.has(r[1]) && !files.has(r[1]))
writeFileSync('.probe/PH9-rest.txt', rest.map((r) => line(r[1])).join('\n') + '\n')
console.log(`next ${new Set(next).size} (excluded-with-pic ${excluded.length}), rest ${rest.length}, ph8 ${ph8.size}, exists ${existsSync('content/photos/PH9.yaml')}`)

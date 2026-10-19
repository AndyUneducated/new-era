// Writes research/photo-<batch>.md for each batch named on the command line (180 people each): people still
// without a portrait, fallen officials first, highest rank first. Usage: node research/scripts/photo-lists.ts PH4 PH5
import { readFileSync, writeFileSync } from 'node:fs'

type P = { id: string; name: string; roles?: string[]; status?: string; headline?: string; photo?: unknown }
const db = JSON.parse(readFileSync('public/data/db.json', 'utf8')) as { people: P[] }
const batches = process.argv.slice(2)
const SIZE = 180

const RANK = ['psc', 'pb', 'cmc', 'sec', 'general', 'cc', 'prov', 'minister', 'ccdi', 'acc', 'tiger']
const rank = (p: P) => {
  const i = RANK.findIndex((k) => (p.roles ?? []).includes(k))
  return i < 0 ? RANK.length : i
}
const fallen = (p: P) => ['purged', 'detained', 'missing'].includes(p.status ?? '') || (p.roles ?? []).includes('tiger')
const rest = db.people.filter((p) => !p.photo).sort((a, b) => Number(fallen(b)) - Number(fallen(a)) || rank(a) - rank(b))

batches.forEach((b, i) => {
  const rows = rest.slice(i * SIZE, (i + 1) * SIZE).map((p) => `- ${p.id} ${p.name}（${p.headline ?? ''}）`)
  writeFileSync(`research/photo-${b}.md`, `# ${b} 照片清单（按优先级）\n\n落马者在前，按职级排；百度百科按名字只返回默认词条，同名者务必核对职务。\n\n${rows.join('\n')}\n`)
})
console.log(`${batches.join(', ')}: ${Math.min(rest.length, batches.length * SIZE)} of ${rest.length} without photo`)

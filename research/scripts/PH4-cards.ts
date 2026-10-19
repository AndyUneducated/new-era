// Baidu Baike card (abstract + lead image) for every person on research/photo-PH4.md, into .probe/PH4-cards.tsv.
//   node research/scripts/PH4-cards.ts [from] [to]      rows from..to of the list (1-based)
//   node research/scripts/PH4-cards.ts --name=某某        one name, all fields, into .probe/PH4-card-one.json
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const api = (name: string, extra = '') =>
  `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_length=200&bk_key=${encodeURIComponent(name)}${extra}`

mkdirSync('.probe', { recursive: true })
const args = process.argv.slice(2)
const one = args.find((a) => a.startsWith('--name='))?.slice(7)
if (one) {
  const extra = args.find((a) => a.startsWith('--extra='))?.slice(8) ?? ''
  const r = await (await fetch(api(one, extra), { headers: { 'User-Agent': UA } })).json()
  writeFileSync('.probe/PH4-card-one.json', JSON.stringify(r, null, 1))
} else await all()

async function all() {
const rows = readFileSync('research/photo-PH4.md', 'utf8')
  .split('\n')
  .map((l) => l.match(/^- ([a-z0-9-]+) (\S+?)（/))
  .filter((m): m is RegExpMatchArray => !!m)
const from = Number(args[0] ?? 1)
const to = Number(args[1] ?? rows.length)
const out = '.probe/PH4-cards.tsv'
if (from === 1) writeFileSync(out, '')
for (let i = from - 1; i < Math.min(to, rows.length); i++) {
  const [, id, name] = rows[i]
  try {
    const r = (await (await fetch(api(name), { headers: { 'User-Agent': UA } })).json()) as Record<string, unknown>
    const abs = String(r.abstract ?? r.desc ?? '').replace(/\s+/g, ' ').slice(0, 160)
    appendFileSync(out, [i + 1, id, name, r.newLemmaId ?? r.id ?? '', r.desc ?? '', abs, r.image ?? r.src ?? '', `${r.imageWidth ?? ''}x${r.imageHeight ?? ''}`, r.url ?? ''].join('\t') + '\n')
  } catch (e) {
    appendFileSync(out, `${i + 1}\t${id}\t${name}\tERR ${(e as Error).message}\n`)
  }
  await new Promise((r) => setTimeout(r, 300))
}
console.log('done')
}

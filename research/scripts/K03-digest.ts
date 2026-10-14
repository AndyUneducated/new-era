// One block per K03 person for writing the cards: list (cc / cca) and the bracketed note from the Xinhua list
// (ethnicity, 女), the Wikidata record, and the start of the zhwiki text kept by K03-screen.
//   node research/scripts/K03-digest.ts [chunk size]   -> .probe/K03-digest-<n>.txt, .probe/K03-facts.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const roster = JSON.parse(read('.probe/K03-roster.json')) as { names: { name: string; list: string }[] }
const qid = JSON.parse(read('.probe/K03-qid.json')) as Record<string, string>

// notes in the Xinhua lists: 马启智（回族） 乌云其木格（女，蒙古族）
const notes = new Map<string, string>()
for (const f of ['k02-xinhua-2002-11-14-16-cc', 'k02-xinhua-2002-11-14-16-cca'])
  for (const m of read(`sources/text/${f}.txt`).matchAll(/(\S+?)（([^）]+)）/g)) notes.set(m[1], m[2])

type Rec = { born?: string; died?: string; birthplace?: string; description?: string; positions: { label: string; from?: string; to?: string }[] }
const size = Number(process.argv[2] ?? 45)
const facts: Record<string, unknown> = {}
const blocks: string[] = []
for (const { name, list } of roster.names) {
  const q = qid[name]
  const rec = JSON.parse(read(`research/wikidata/${q}.json`)) as Rec
  const note = notes.get(name)
  const gender = note?.includes('女') ? 'f' : 'm'
  const ethnicity = note?.split('，').find((s) => s.endsWith('族'))
  facts[name] = { q, list, gender, ethnicity, born: rec.born, died: rec.died, birthplace: rec.birthplace }
  const wikiFile = join(ROOT, '.probe/K03-wiki', `${name}-${q}.txt`)
  const wiki = existsSync(wikiFile) ? readFileSync(wikiFile, 'utf8').replace(/\s+/g, ' ').slice(0, 520) : ''
  blocks.push(
    [
      `## ${name} ${q} ${list}${note ? ` （${note}）` : ''} | ${rec.born ?? '?'}–${rec.died ?? ''} | 生于 ${rec.birthplace ?? '?'}`,
      ...rec.positions.map((p) => `  - ${p.label} ${p.from ?? ''}–${p.to ?? ''}`),
      `  > ${wiki}`,
    ].join('\n'),
  )
}
for (let i = 0; i * size < blocks.length; i++) writeFileSync(join(ROOT, `.probe/K03-digest-${i + 1}.txt`), blocks.slice(i * size, (i + 1) * size).join('\n') + '\n')
writeFileSync(join(ROOT, '.probe/K03-facts.json'), JSON.stringify(facts, null, 1))
console.log(`${blocks.length} people in ${Math.ceil(blocks.length / size)} digests`)

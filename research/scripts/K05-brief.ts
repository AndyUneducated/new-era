// K05: a short writing brief per person (Wikidata birth/birthplace/description + the Wikipedia lead).
//   node research/scripts/K05-brief.ts   -> .probe/K05-brief.txt, .probe/K05-facts.json
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PEOPLE } from './K05-ids.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const reuse = JSON.parse(readFileSync(join(ROOT, '.probe', 'K05-reuse.json'), 'utf8')) as Record<string, string>

type Facts = { born?: string; birthplace?: string; desc?: string; lead?: string; leadBorn?: string }
const facts: Record<string, Facts> = {}
const out: string[] = []

for (const [raw, id, q] of PEOPLE) {
  const f: Facts = {}
  const wd = join(ROOT, 'research', 'wikidata', `${q}.json`)
  if (q && existsSync(wd)) {
    const j = JSON.parse(readFileSync(wd, 'utf8'))
    f.born = j.born || undefined
    f.birthplace = j.birthplace || undefined
    f.desc = j.description || undefined
  }
  const src = reuse[id] ?? `k05-wiki-${id}`
  const tf = join(ROOT, 'sources', 'text', `${src}.txt`)
  if (existsSync(tf)) {
    const text = readFileSync(tf, 'utf8').replace(/\[\d+\]/g, '').replace(/\n+/g, ' ')
    const name = raw.replace(/（.*?）/g, '')
    const at = text.indexOf(`${name}（`)
    if (at >= 0) {
      f.lead = text.slice(at, at + 230)
      const m = /^[^（]*（(\d{4})年(?:(\d{1,2})月)?(?:(\d{1,2})日)?/.exec(f.lead)
      if (m) f.leadBorn = [m[1], m[2]?.padStart(2, '0'), m[3]?.padStart(2, '0')].filter(Boolean).join('-')
    }
  }
  facts[id] = f
  out.push(`## ${raw} ${id} ${q} b=${f.born ?? '?'}/${f.leadBorn ?? '?'} bp=${f.birthplace ?? '?'} | ${f.desc ?? ''}`)
  if (f.lead) out.push('  ' + f.lead)
}
writeFileSync(join(ROOT, '.probe', 'K05-brief.txt'), out.join('\n') + '\n', 'utf8')
writeFileSync(join(ROOT, '.probe', 'K05-facts.json'), JSON.stringify(facts, null, 1), 'utf8')
console.log('people', PEOPLE.length)

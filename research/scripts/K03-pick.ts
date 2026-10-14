// Lists the Wikidata candidates for each K03 name compactly, with a guess (human, born before 1970,
// described as a Chinese politician, official or officer), for picking QIDs by hand.
//   node research/scripts/K03-pick.ts   -> .probe/K03-pick.txt, .probe/K03-guess.json
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Cand = { id: string; label: string; en?: string; desc?: string; enDesc?: string; born?: string; died?: string; human?: boolean }
const cands = JSON.parse(readFileSync(join(ROOT, '.probe/K03-candidates.json'), 'utf8')) as Record<string, Cand[]>

const POL = /政治|官员|中国共产党|中共|中华人民共和国|将|politician|official|general|officer|engineer|scientist|economist|writer|manager|businessman|军/i
const lines: string[] = []
const guess: Record<string, string | null> = {}
for (const [name, list] of Object.entries(cands)) {
  const ok = list.filter((c) => c.human && c.label === name && (!c.born || c.born < '1970') && POL.test(`${c.desc ?? ''} ${c.enDesc ?? ''}`))
  guess[name] = ok.length === 1 ? ok[0].id : null
  lines.push(`${ok.length === 1 ? '  ' : ok.length ? '??' : '--'} ${name}`)
  for (const c of list)
    lines.push(`     ${c.id === guess[name] ? '*' : ' '} ${c.id} ${c.label} | ${c.en ?? ''} | ${c.born ?? ''}–${c.died ?? ''} | ${c.desc ?? ''} | ${c.enDesc ?? ''}${c.human ? '' : ' [not human]'}`)
}
writeFileSync(join(ROOT, '.probe/K03-pick.txt'), lines.join('\n') + '\n')
writeFileSync(join(ROOT, '.probe/K03-guess.json'), JSON.stringify(guess, null, 1))
const n = Object.values(guess).filter(Boolean).length
console.log(`${n} guessed, ${Object.keys(guess).length - n} to check -> .probe/K03-pick.txt`)

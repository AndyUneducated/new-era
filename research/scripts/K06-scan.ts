// Looks through every archived source text for K06 names next to fall words (罢免、审查、开除…) or plenum changes (递补).
//   node research/scripts/K06-scan.ts [extra names]   -> .probe/K06-scan.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const bare = (s: string) => s.replace(/（[^）]*）/g, '').trim()
const { mine } = JSON.parse(readFileSync(join(ROOT, '.probe', 'K06-roster.json'), 'utf8')) as { mine: { name: string }[] }
const names = [...new Set([...mine.map((r) => bare(r.name)), ...process.argv.slice(2)])]
const WORDS = /罢免|审查|开除|违纪|立案|递补|调查|落马|被查|逝世|病逝|去世|免去|撤销|停职/
const dir = join(ROOT, 'sources', 'text')
const hits = new Map<string, string[]>()
for (const f of readdirSync(dir).filter((f) => f.endsWith('.txt'))) {
  const text = readFileSync(join(dir, f), 'utf8')
  if (!names.some((n) => text.includes(n))) continue
  for (const para of text.split(/\n+/)) {
    if (!WORDS.test(para)) continue
    for (const n of names) {
      const i = para.indexOf(n)
      if (i < 0) continue
      const snip = para.slice(Math.max(0, i - 60), i + 80).replace(/\s+/g, ' ')
      hits.set(n, [...(hits.get(n) ?? []), `  ${f.replace(/\.txt$/, '')}: …${snip}…`])
    }
  }
}
const out = names.filter((n) => hits.has(n)).map((n) => `## ${n}\n${[...new Set(hits.get(n))].slice(0, 12).join('\n')}`)
writeFileSync(join(ROOT, '.probe', 'K06-scan.txt'), out.join('\n\n') + '\n')
console.log(`${hits.size} of ${names.length} names have hits`)

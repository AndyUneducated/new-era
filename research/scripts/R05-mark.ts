// Fills id / done in research/falls-list/R05.yaml: ids of new cards from research/roster/R05.yaml (by name),
// done = the id has a case record in content/falls/R05.yaml (or is the exemplar song-liang).
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'research/falls-list/R05.yaml'
const roster = new Map<string, string>()
for (const m of readFileSync('research/roster/R05.yaml', 'utf8').matchAll(/id: ([a-z0-9-]+), name: ([^,]+),/g)) roster.set(m[2], m[1])
const recs = new Set([...readFileSync('content/falls/R05.yaml', 'utf8').matchAll(/^([a-z0-9-]+):\s*$/gm)].map((m) => m[1]))
recs.add('song-liang')

let done = 0
const out = readFileSync(FILE, 'utf8')
  .split('\n')
  .map((line) => {
    const m = line.match(/^- \{ name: ([^,]+), (.*), id: '?([a-z0-9-]*)'?, done: (true|false) \}$/)
    if (!m) return line
    const id = m[3] || roster.get(m[1]) || ''
    const ok = !!id && recs.has(id)
    if (ok) done++
    return `- { name: ${m[1]}, ${m[2]}, id: ${id ? id : "''"}, done: ${ok} }`
  })
writeFileSync(FILE, out.join('\n'))
console.log(`${done} done`)

// P01 one-off: which chief names already have a person entry (content/people) or a roster id.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const inflight = new Set<string>(parse(readFileSync('research/round.yaml', 'utf8')).inflight)
const byName = new Map<string, string[]>()
const add = (name: string, tag: string) => byName.set(name, [...(byName.get(name) ?? []), tag])
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  const b = f.replace('.yaml', '')
  try {
    for (const p of parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) add(p.name, `${p.id}${inflight.has(b) ? ` (inflight ${b})` : ''}`)
  } catch (e) {
    add('!!', `${f} unparsable`)
  }
}
const rosters = ['research/roster.yaml', ...(existsSync('research/roster') ? readdirSync('research/roster').map((f) => `research/roster/${f}`) : [])]
for (const f of rosters)
  try {
    for (const r of parse(readFileSync(f, 'utf8')) ?? []) if (!byName.get(r.name)?.some((t) => t.startsWith(r.id))) add(r.name, `${r.id} (roster ${r.batch}, no entry)`)
  } catch {}

const names = readFileSync('.probe/P01-names.txt', 'utf8').split(/\s+/).filter(Boolean)
const out = [...new Set(names)].map((n) => `${n}\t${byName.get(n)?.join(' ; ') ?? '-'}`)
writeFileSync('.probe/P01-people.txt', out.join('\n') + '\n')

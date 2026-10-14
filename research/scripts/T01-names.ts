// T01 one-off: export every 15th–20th CC / alternate name and every person name already on the site,
// then check a candidate list against both. Output: .probe/T01-names.txt, .probe/T01-check.txt
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'

const strip = (s: string) => String(s).replace(/（.*?）/g, '').trim()

const congresses = parse(readFileSync('content/congresses/K01.yaml', 'utf8')) as any[]
const cc = new Map<string, string[]>()
for (const c of congresses) {
  for (const key of ['cc', 'cca'] as const) {
    for (const n of c[key] ?? []) {
      const k = strip(n)
      cc.set(k, [...(cc.get(k) ?? []), `${c.n}${key}`])
    }
  }
}

const people = new Map<string, string>()
for (const f of readdirSync('content/people')) {
  if (!f.endsWith('.yaml')) continue
  const list = parse(readFileSync(`content/people/${f}`, 'utf8')) as any[]
  for (const p of list ?? []) people.set(p.name, `${p.id} (${f})`)
}
const roster = new Map<string, string>()
const rosterFiles = ['research/roster.yaml', ...readdirSync('research/roster').map((f) => `research/roster/${f}`)]
for (const f of rosterFiles) {
  const list = parse(readFileSync(f, 'utf8')) as any[]
  for (const p of list ?? []) if (p?.name) roster.set(p.name, `${p.id} (${f})`)
}

const lines: string[] = [`# CC/CCA names: ${cc.size}`, ...[...cc].map(([n, w]) => `${n}\t${w.join(',')}`)]
lines.push(`# people names: ${people.size}`, ...[...people].map(([n, w]) => `${n}\t${w}`))
writeFileSync('.probe/T01-names.txt', lines.join('\n') + '\n', 'utf8')

const candFile = 'research/scripts/T01-candidates.txt'
if (existsSync(candFile)) {
  const out: string[] = []
  for (const raw of readFileSync(candFile, 'utf8').split(/\r?\n/)) {
    const n = raw.trim()
    if (!n || n.startsWith('#')) continue
    const flags = [
      cc.has(n) ? `CC:${cc.get(n)!.join(',')}` : '',
      people.has(n) ? `PEOPLE:${people.get(n)}` : '',
      roster.has(n) ? `ROSTER:${roster.get(n)}` : '',
    ].filter(Boolean)
    out.push(`${flags.length ? 'SKIP' : 'OK  '}\t${n}\t${flags.join(' ')}`)
  }
  writeFileSync('.probe/T01-check.txt', out.join('\n') + '\n', 'utf8')
}

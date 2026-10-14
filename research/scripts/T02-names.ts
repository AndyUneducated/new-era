// T02: export every 15th–20th CC / CCA name and every name already in content/people and the rosters,
// so new purge cards can be checked against them. Usage: node research/scripts/T02-names.ts [name ...]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

const root = join(import.meta.dirname, '..', '..')
const strip = (s: string) => s.replace(/（.*?）/g, '').trim()

const congresses = parse(readFileSync(join(root, 'content/congresses/K01.yaml'), 'utf8')) as { n: number; cc?: string[]; cca?: string[] }[]
const cc = new Map<string, string[]>()
for (const c of congresses) {
  for (const [k, list] of [['cc', c.cc], ['cca', c.cca]] as const) {
    for (const raw of list ?? []) {
      const n = strip(String(raw))
      cc.set(n, [...(cc.get(n) ?? []), `${c.n}${k}`])
    }
  }
}

const people = new Map<string, string>()
for (const dir of ['content/people', 'research/roster']) {
  for (const f of readdirSync(join(root, dir)).filter((f) => f.endsWith('.yaml'))) {
    if (dir === 'content/people' && f === 'T02.yaml') continue
    const data = parse(readFileSync(join(root, dir, f), 'utf8')) as { id: string; name: string }[] | null
    for (const p of data ?? []) if (p?.name) people.set(strip(p.name), `${p.id} (${dir}/${f})`)
  }
}
const roster = parse(readFileSync(join(root, 'research/roster.yaml'), 'utf8')) as { id: string; name: string }[]
for (const p of roster ?? []) if (p?.name && !people.has(strip(p.name))) people.set(strip(p.name), `${p.id} (research/roster.yaml)`)

const out = [
  `# CC/CCA names (${cc.size})`,
  ...[...cc].map(([n, w]) => `${n}\t${w.join(',')}`),
  '',
  `# existing people (${people.size})`,
  ...[...people].map(([n, w]) => `${n}\t${w}`),
]
writeFileSync(join(root, '.probe/T02-names.txt'), out.join('\n'), 'utf8')

const query = process.argv.slice(2)
if (query.length) {
  const lines = query.map((q) => `${q}\tcc:${cc.get(q)?.join(',') ?? '-'}\tpeople:${people.get(q) ?? '-'}`)
  writeFileSync(join(root, '.probe/T02-check.txt'), lines.join('\n'), 'utf8')
}
console.log(`cc ${cc.size}, people ${people.size}`)

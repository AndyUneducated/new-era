// R02 one-off: which people in the 2015 falls list already have entries, and what their cards hold.
//   node research/scripts/R02-scan.ts   writes .probe/R02-scan.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
import { NAMES } from './R02-names.ts'

const out: string[] = []
const people: Record<string, { file: string; p: any }[]> = {}
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  const list = parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []
  for (const p of Array.isArray(list) ? list : []) (people[p.name] ??= []).push({ file: f, p })
}
const rosters = [readFileSync('research/roster.yaml', 'utf8'), ...readdirSync('research/roster').map((f) => readFileSync(`research/roster/${f}`, 'utf8'))].join('\n')
const falls: Record<string, string> = {}
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml'))) {
  const m = parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}
  for (const k of Object.keys(m)) falls[k] = f
}
for (const n of NAMES) {
  const hits = people[n] ?? []
  if (!hits.length) {
    const r = rosters.split('\n').filter((l) => l.includes(`name: ${n}`))
    out.push(`${n}\tNONE\t${r.join(' | ')}`)
    continue
  }
  for (const { file, p } of hits) {
    const fall = (p.fall ?? []).map((s: any) => `${s.date} ${String(s.text).slice(0, 40)} [${s.cite}]`).join(' / ')
    out.push(`${n}\t${p.id}\t${file}\ttier${p.tier}\t${p.status}\tfalls:${falls[p.id] ?? '-'}\twd:${p.ids?.wikidata ?? '-'}\n    ${p.headline}\n    FALL: ${fall}\n    CITES: ${(p.cites ?? []).join(' ')}`)
  }
}
writeFileSync('.probe/R02-scan.txt', out.join('\n') + '\n', 'utf8')
console.log(`${NAMES.length} names`)

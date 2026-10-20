// FX1: how the status of fallen people lines up with their fall steps (detained before any verdict, purged after one).
//   node research/scripts/FX1-status-audit.ts   -> .probe/FX1-status-audit.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { stepOf } from '../../src/lib/caseparse.ts'

const db = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const people: any[] = Array.isArray(db.people) ? db.people : Object.values(db.people ?? {})
const kinds = (p: any) => (p.fall ?? []).map((f: any) => stepOf(f.text))
const out: string[] = []
const detainedNoVerdict = people.filter((p) => p.status === 'detained' && !kinds(p).includes('sentenced'))
const purgedWithVerdict = people.filter((p) => p.status === 'purged' && kinds(p).includes('sentenced'))
out.push(`detained without a sentenced step: ${detainedNoVerdict.length}`)
for (const p of detainedNoVerdict) out.push(`  ${p.id}\t${p.name}\t${kinds(p).join(',')}`)
out.push(`purged with a sentenced step: ${purgedWithVerdict.length}`)
for (const p of purgedWithVerdict) out.push(`  ${p.id}\t${p.name}\t${kinds(p).join(',')}`)
writeFileSync('.probe/FX1-status-audit.txt', out.join('\n') + '\n')

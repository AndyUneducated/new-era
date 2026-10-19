// R10: dump the SOE / finance case studies (people, sections, editor notes) to read which people they name.
//   node research/scripts/R10-cases.ts   -> .probe/R10-cases.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const WANT = ['cnpc-system', 'china-resources', 'csrc-2015', 'finance-2023', 'tobacco-system', 'stock-crash-2015']
const out: string[] = []
for (const f of readdirSync('content/cases').filter((f) => f.endsWith('.yaml')))
  for (const c of (parse(readFileSync(`content/cases/${f}`, 'utf8')) ?? []) as any[]) {
    if (!WANT.includes(c.id)) continue
    out.push(`######## ${c.id} @${f} ${c.title ?? c.name ?? ''}`)
    out.push(`people: ${(c.people ?? []).join(' ')}`)
    out.push(`summary: ${c.summary}`)
    for (const s of c.sections ?? []) out.push(`## ${s.h} [${(s.cites ?? []).join(', ')}]\n${s.text}`)
    for (const s of c.editor ?? []) out.push(`## EDITOR [${(s.cites ?? []).join(', ')}]\n${s.text}`)
    for (const s of c.voices ?? []) out.push(`## VOICE ${s.voice} [${s.cite}] ${s.text}`)
    out.push('')
  }
writeFileSync('.probe/R10-cases.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

// For the people C15 adds steps to: where their case record is, and whether it carries fall / status / statusNote
// (the record's statusNote overrides the card's in tools/build/load.ts).
//   node research/scripts/C15-rec.ts id1 id2 ... -> .probe/C15-rec.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Rec = { fall?: { date: string; text: string }[]; status?: string; statusNote?: string }
const recs = new Map<string, Rec & { file: string }>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const [id, r] of Object.entries((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as Record<string, Rec>))
    recs.set(id, { ...r, file: f })
const out = process.argv.slice(2).map((id) => {
  const r = recs.get(id)
  if (!r) return `${id}\t-`
  return `${id}\t${r.file}\tstatus=${r.status ?? ''}\tnote=${r.statusNote ?? ''}\tfall=${(r.fall ?? []).map((s) => `${s.date} ${s.text.slice(0, 20)}`).join(' / ')}`
})
writeFileSync('.probe/C15-rec.txt', out.join('\n') + '\n', 'utf8')

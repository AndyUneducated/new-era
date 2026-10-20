// CS10: character and people counts for the two CS10 case studies, written to .probe/cs10-count.txt
import { writeFileSync } from 'node:fs'
import { loadAll } from '../../tools/build/load.ts'

const d = await loadAll()
const out: string[] = []
const len = (s: string) => [...s.replace(/\s/g, '')].length
for (const id of ['insiders-law-enforcement', 'central-inspection']) {
  const c = (d.cases as any[]).find((x) => x.id === id)
  if (!c) { out.push(`${id}: missing`); continue }
  const body = len(c.summary) + c.sections.reduce((n: number, s: any) => n + len(s.text), 0)
  const ed = (c.editor ?? []).reduce((n: number, e: any) => n + len(e.text), 0)
  const vo = (c.voices ?? []).reduce((n: number, v: any) => n + len(v.zh ?? v.text), 0)
  out.push(`${id}\tpeople ${c.people.length}\tsections ${c.sections.length}\tsummary+sections ${body}\teditor ${ed}\tvoices ${vo}\ttotal ${body + ed + vo}\tevents ${c.events.length}`)
}
const ev = (d.events as any[]).filter((e) => e.id.startsWith('cs10-'))
out.push(`cs10 events: ${ev.length}`)
for (const e of ev) out.push(`\t${e.id}\tsummary ${len(e.summary)}`)
writeFileSync('.probe/cs10-count.txt', out.join('\n') + '\n')

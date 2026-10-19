// Dumps every event (date, id, title, people) and every concept policy whose events list is empty, so E10 can
// check for duplicates and find policies that need a landing event.
//   node research/scripts/E10-dump.ts   -> .probe/E10-events.txt, .probe/E10-policies.txt, .probe/E10-people.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SKIP = /^(I06|I07|I08|E10)\.yaml$/
const yamls = (d: string) => readdirSync(join(ROOT, 'content', d)).filter((f) => f.endsWith('.yaml'))
type Ev = { id: string; date: string; end?: string; title: string; lane: string; people?: string[] }
const ev: string[] = []
for (const f of yamls('events')) {
  if (f === 'E10.yaml') continue
  for (const e of (parse(readFileSync(join(ROOT, 'content', 'events', f), 'utf8')) ?? []) as Ev[])
    ev.push(`${String(e.date)}\t${e.end ?? ''}\t${e.id}\t${e.lane}\t${e.title}\t${(e.people ?? []).join(',')}\t${f}`)
}
ev.sort()
writeFileSync(join(ROOT, '.probe', 'E10-events.txt'), ev.join('\n') + '\n')

type Pol = { date: string; name: string; text: string; events?: string[]; cite: string }
const pol: string[] = []
const dump = (file: string, id: string, ps: Pol[] | undefined) => {
  for (const p of ps ?? []) pol.push(`${(p.events ?? []).length ? 'HAS' : 'EMPTY'}\t${file}\t${id}\t${String(p.date)}\t${p.name}\t${(p.events ?? []).join(',')}\t${p.text}`)
}
for (const f of yamls('concepts')) {
  if (SKIP.test(f)) continue
  for (const c of (parse(readFileSync(join(ROOT, 'content', 'concepts', f), 'utf8')) ?? []) as { id: string; policies?: Pol[] }[]) dump(f, c.id, c.policies)
}
for (const f of yamls('concept-more')) {
  if (SKIP.test(f)) continue
  for (const [id, m] of Object.entries((parse(readFileSync(join(ROOT, 'content', 'concept-more', f), 'utf8')) ?? {}) as Record<string, { policies?: Pol[] }>)) dump('more/' + f, id, m.policies)
}
writeFileSync(join(ROOT, '.probe', 'E10-policies.txt'), pol.join('\n') + '\n')

const ppl: string[] = []
for (const f of yamls('people'))
  for (const p of (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as { id: string; name: string; status: string }[])
    ppl.push(`${p.id}\t${p.name}\t${p.status}\t${f}`)
writeFileSync(join(ROOT, '.probe', 'E10-people.txt'), ppl.join('\n') + '\n')
const cs: string[] = []
for (const f of yamls('concepts')) {
  if (SKIP.test(f)) continue
  for (const c of (parse(readFileSync(join(ROOT, 'content', 'concepts', f), 'utf8')) ?? []) as { id: string; name: string }[]) cs.push(`${c.id}\t${c.name}\t${f}`)
}
writeFileSync(join(ROOT, '.probe', 'E10-concepts.txt'), cs.join('\n') + '\n')
console.log(ev.length, pol.length, ppl.length, cs.length)

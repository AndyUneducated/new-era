// CS9 one-off: check every cite / event / person id used by content/cases/CS9.yaml and content/events/CS9.yaml exists,
// and count the Chinese characters of each case. Output: .probe/cs9-check.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const load = (f: string) => parse(readFileSync(f, 'utf8'))
const ids = (dir: string) => {
  const s = new Set<string>()
  for (const f of readdirSync(dir)) if (f.endsWith('.yaml')) for (const x of load(`${dir}/${f}`) ?? []) if (x?.id) s.add(x.id)
  return s
}
const people = ids('content/people')
const events = ids('content/events')
const factions = ids('content/factions')
const out: string[] = []
const src = (id: string) => existsSync(`sources/text/${id}.txt`)

const cites = (o: any, acc: Set<string>) => {
  if (Array.isArray(o)) o.forEach((x) => cites(x, acc))
  else if (o && typeof o === 'object')
    for (const [k, v] of Object.entries(o)) {
      if (k === 'cites' && Array.isArray(v)) v.forEach((x) => acc.add(String(x)))
      else if (k === 'cite') acc.add(String(v))
      else cites(v, acc)
    }
}
const han = (s: string) => (s.match(/[\u4e00-\u9fff]/g) ?? []).length

for (const f of ['content/cases/CS9.yaml', 'content/events/CS9.yaml']) {
  for (const x of load(f)) {
    const c = new Set<string>()
    cites(x, c)
    const bad = [...c].filter((id) => !src(id))
    const badP = (x.people ?? []).filter((p: string) => !people.has(p))
    const badE = (x.events ?? []).filter((e: string) => !events.has(e))
    const badF = (x.factions ?? []).filter((e: string) => !factions.has(e))
    let chars = 0
    if (f.includes('cases')) {
      chars = han(x.summary ?? '') + (x.sections ?? []).reduce((a: number, s: any) => a + han(s.h ?? '') + han(s.text ?? ''), 0)
      chars += (x.voices ?? []).reduce((a: number, v: any) => a + han(v.text ?? ''), 0)
      chars += (Array.isArray(x.editor) ? x.editor : [x.editor ?? '']).reduce((a: number, e: any) => a + han(typeof e === 'string' ? e : e?.text ?? ''), 0)
    }
    out.push(`## ${x.id} people=${(x.people ?? []).length} events=${(x.events ?? []).length} cites=${c.size} chars=${chars}`)
    if (bad.length) out.push(`  missing source: ${bad.join(' ')}`)
    if (badP.length) out.push(`  unknown people: ${badP.join(' ')}`)
    if (badE.length) out.push(`  unknown events: ${badE.join(' ')}`)
    if (badF.length) out.push(`  unknown factions: ${badF.join(' ')}`)
  }
}
writeFileSync('.probe/cs9-check.txt', out.join('\n') + '\n')

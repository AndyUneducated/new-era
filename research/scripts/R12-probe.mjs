// R12 worklist probe: node research/scripts/R12-probe.mjs → .probe/r12-outside.txt, .probe/r12-plea.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
const d = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const people = new Map(d.people.map((p) => [p.id, p]))
const src = new Map((Array.isArray(d.sources) ? d.sources : Object.values(d.sources)).map((s) => [s.id, s]))
const ids = (f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t')[0])

const fallsDir = 'content/falls'
const fallsFiles = readdirSync(fallsDir).filter((f) => f.endsWith('.yaml'))
const where = new Map()
for (const f of fallsFiles) {
  const lines = readFileSync(`${fallsDir}/${f}`, 'utf8').split(/\r?\n/)
  lines.forEach((l, i) => {
    const m = /^([a-z0-9-]+):\s*$/.exec(l)
    if (m) where.set(m[1], `${f}:${i + 1}`)
  })
}
const sdesc = (id) => {
  const s = src.get(id)
  return s ? `${id} [${s.voice ?? '?'}${s.rumor ? ',RUMOR' : ''}] ${s.title ?? ''}` : `${id} [?]`
}

const out1 = []
for (const id of ids('research/lists/R15-outside-cases.txt')) {
  const p = people.get(id)
  const c = p.case
  out1.push(`## ${id} ${p.name} | ${p.status} | ${p.roles.join(',')} | ${where.get(id) ?? 'NO-FILE'}`)
  out1.push(`  headline: ${p.headline ?? ''}`)
  out1.push(`  statusNote: ${p.statusNote ?? ''}`)
  for (const s of p.fall ?? []) out1.push(`  fall ${s.date} ${s.text} <${s.cite}>`)
  out1.push(`  trigger: ${c.trigger ? `${c.trigger.kind} | ${c.trigger.text} <${c.trigger.cite}>` : '-'}`)
  out1.push(`  politics: ${c.politics ? `${c.politics.level} | ${c.politics.why} <${c.politics.cites.join(',')}>` : '-'}`)
  out1.push(`  charges: ${c.charges.join(',')}`)
  const cs = new Set([...(p.cites ?? []), ...(p.fall ?? []).map((s) => s.cite), ...(c.voices ?? []).map((v) => v.cite)])
  for (const x of cs) out1.push(`  src ${sdesc(x)}`)
}
writeFileSync('.probe/r12-outside.txt', out1.join('\n'), 'utf8')

const PLEA = /自首|立功|揭发他人|退赃|退缴|退赔|退还|认罪|悔罪|如实供述|主动交代|坦白/
const textDir = 'sources/text'
const texts = readdirSync(textDir).filter((f) => f.endsWith('.txt')).map((f) => [f.slice(0, -4), readFileSync(`${textDir}/${f}`, 'utf8')])
const out2 = []
for (const id of ids('research/lists/R15-sentenced-no-plea.txt')) {
  const p = people.get(id)
  const c = p.case
  out2.push(`## ${id} ${p.name} | ${p.roles.join(',')} | ${where.get(id) ?? 'NO-FILE'} | plea=${(c.plea ?? []).length}`)
  for (const s of p.fall ?? []) out2.push(`  fall ${s.date} ${s.text} <${s.cite}>`)
  for (const [sid, t] of texts) {
    if (!t.includes(p.name)) continue
    const hits = t
      .split(/[。\n]/)
      .filter((s) => s.includes(p.name) && PLEA.test(s))
      .map((s) => s.trim().slice(0, 260))
    if (hits.length) {
      out2.push(`  >> ${sdesc(sid)}`)
      for (const h of hits.slice(0, 4)) out2.push(`     · ${h}`)
    }
  }
}
writeFileSync('.probe/r12-plea.txt', out2.join('\n'), 'utf8')
console.log('ok')

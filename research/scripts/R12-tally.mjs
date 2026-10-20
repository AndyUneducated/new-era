// tally the R12 edits: who now has plea / repression / persecution, against the two R15 lists
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
const ids = (f) => readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => l.split('\t')[0])
const sentenced = new Set(ids('research/lists/R15-sentenced-no-plea.txt'))
const outside = new Set(ids('research/lists/R15-outside-cases.txt'))
const plea = new Map(), repression = [], persecution = []
const eol = []
for (const f of readdirSync('content/falls').filter((x) => x.endsWith('.yaml'))) {
  const raw = readFileSync(`content/falls/${f}`, 'utf8')
  const crlf = (raw.match(/\r\n/g) ?? []).length, lf = (raw.match(/(?<!\r)\n/g) ?? []).length
  if (crlf && lf) eol.push(`${f} crlf=${crlf} lone-lf=${lf}`)
  let cur = null, inPlea = false
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([a-z0-9-]+):\s*$/)
    if (m) { cur = m[1]; inPlea = false; continue }
    if (/^  plea:/.test(line)) { inPlea = true; plea.set(cur, []); continue }
    if (inPlea) {
      const k = line.match(/^    - \{ kind: (\w+)/)
      if (k) { plea.get(cur).push(k[1]); continue }
      inPlea = false
    }
    if (/^    level: repression/.test(line)) repression.push(cur)
    if (/kind: persecution/.test(line)) persecution.push(cur)
  }
}
const kinds = {}
let entries = 0
for (const [id, ks] of plea) if (sentenced.has(id)) for (const k of ks) { kinds[k] = (kinds[k] ?? 0) + 1; entries++ }
const out = [
  `plea people on list: ${[...plea.keys()].filter((i) => sentenced.has(i)).length}`,
  `plea people NOT on list: ${[...plea.keys()].filter((i) => !sentenced.has(i)).join(' ')}`,
  `plea entries: ${entries} ${JSON.stringify(kinds)}`,
  `list people without plea: ${[...sentenced].filter((i) => !plea.has(i)).length}`,
  [...sentenced].filter((i) => !plea.has(i)).join(' '),
  `repression ${repression.length}: ${repression.join(' ')}`,
  `repression not on outside list: ${repression.filter((i) => !outside.has(i)).join(' ')}`,
  `persecution ${persecution.length}: ${persecution.join(' ')}`,
  `mixed eol: ${eol.join('; ') || 'none'}`,
]
writeFileSync('.probe/r12-tally.txt', out.join('\n'), 'utf8')
console.log('ok')

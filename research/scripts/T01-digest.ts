// T01 one-off: pull, for each person, the lines that the card needs out of the fetched texts, into
// .probe/T01-digest.txt. Usage: node research/scripts/T01-digest.ts [person-id ...]
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { PEOPLE } from './T01-spec.ts'

const dir = 'sources/text'
const texts = new Map<string, string[]>()
for (const f of readdirSync(dir).filter((f) => f.startsWith('t01-')))
  texts.set(f.replace(/\.txt$/, ''), readFileSync(`${dir}/${f}`, 'utf8').split(/\n/).map((l) => l.trim()).filter(Boolean))
for (const f of readdirSync('.probe').filter((f) => f.startsWith('peek-t01-'))) {
  const id = f.slice(5).replace(/\.txt$/, '')
  if (!texts.has(id)) texts.set(id + ' (peek)', readFileSync(`.probe/${f}`, 'utf8').split(/\n/).map((l) => l.trim()).filter(Boolean))
}
const wd = existsSync('.probe/T01-wd-summary.txt') ? readFileSync('.probe/T01-wd-summary.txt', 'utf8').split('\n') : []
// --pp: only the per-person reports, not the column lists and round-ups
const pp = process.argv.includes('--pp')
const want = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const out: string[] = []
for (const [name, pid] of PEOPLE) {
  if (want.length && !want.includes(pid)) continue
  out.push(`######## ${name} ${pid}`)
  for (const l of wd) if (l.includes(name)) out.push(`  wd: ${l}`)
  for (const [id, lines] of texts) {
    const hits: string[] = []
    const isList = /ccdi-(zjsc|jlsc|djcf)-list/.test(id)
    const isRound = /people-20\d\d-\d\d-\d\d-\d+-verdicts|2016-verdicts/.test(id)
    if (pp && (isList || isRound)) continue
    lines.forEach((l, i) => {
      if (isList) {
        if (l.includes(name)) hits.push(`${l} | ${lines[i + 1] ?? ''}`)
      } else if (isRound) {
        if (l.includes(name)) hits.push(l.length > 40 ? l.slice(Math.max(0, l.indexOf(name) - 60), l.indexOf(name) + 120) : [l, ...lines.slice(i + 1, i + 4)].join(' | '))
      } else if (id.includes(pid.replace(/-(shanghai|liaoning)$/, '')) && !id.endsWith('(peek)')) {
        if ((/担任|曾任|判处|出生|生，|简历|任职|历任|执行|无期|死刑|开除|调查/.test(l) && l.length > 20) || /^(19|20)\d\d[.．年]\d/.test(l)) hits.push(l)
      }
    })
    if (hits.length) out.push(`  [${id}]`, ...hits.map((h) => `    ${h}`))
  }
}
writeFileSync(pp ? '.probe/T01-digest-pp.txt' : '.probe/T01-digest.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

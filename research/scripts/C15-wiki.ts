// Compares the 现状 column of the zh.wikipedia list 中共十八大后落马官员列表 (a markdown dump, path as argument)
// with the fall steps on file: flags rows whose status mentions a sentence or trial the cards do not have.
//   node research/scripts/C15-wiki.ts .probe/R06-wiki-list.txt -> .probe/C15-wiki.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Step = { date: string | number; text: string }
type P = { id: string; name: string; status: string; fall?: Step[] }
const people: (P & { file: string })[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) people.push({ ...p, file: f })
const recs = new Map<string, Step[]>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const [id, r] of Object.entries((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as Record<string, { fall?: Step[] }>))
    recs.set(id, r?.fall ?? [])
const out: string[] = []
for (const l of readFileSync(process.argv[2], 'utf8').split('\n')) {
  const m = l.match(/^\| ([^|]+) \| ([^|]+) \| (20\d\d)年(\d+)月(\d+)日 \| ([^|]*) \|/)
  if (!m) continue
  const name = m[1].replace(/\s/g, '')
  const st = m[6].replace(/\[\d+\]/g, '').trim()
  const wantV = /判处|判决|一审|有期徒刑|无期|死刑|免予刑事处罚/.test(st)
  const wantC = /提起公诉|被起诉|已起诉/.test(st) && !/审查起诉/.test(st.replace(/提起公诉/, ''))
  const wantT = /开庭|受审/.test(st)
  const cands = people.filter((p) => p.name === name)
  if (!cands.length) {
    out.push(`NOCARD\t${m[3]}\t${name}\t${m[2].slice(0, 40)}\t${st}`)
    continue
  }
  for (const c of cands) {
    const steps = [...(c.fall ?? []), ...(recs.get(c.id) ?? [])]
    const txt = steps.map((s) => `${s.date} ${s.text}`).join(' / ')
    const hasV = /判处|判决|宣判|有期徒刑|无期|死刑|免予刑事处罚/.test(txt)
    const hasT = /开庭|公开审理|受审/.test(txt)
    const hasC = /提起公诉|起诉书|检察院.*起诉/.test(txt)
    const flags = [wantV && !hasV ? 'V' : '', wantT && !hasT && !hasV ? 'T' : '', wantC && !hasC && !hasT && !hasV ? 'C' : ''].join('')
    if (flags) out.push(`${flags}\t${m[3]}\t${name}\t${c.id}@${c.file}\t${c.status}\t${st}\t|| ${txt.slice(-160)}`)
  }
}
writeFileSync('.probe/C15-wiki.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

// Matches every 2026 CCDI 中管干部 notice (.probe/C15-heb.txt plus the extras below) against content/people and
// content/falls: which card, which file, whether the card's fall already has a step within 5 days of the notice.
//   node research/scripts/C15-check.ts -> .probe/C15-check.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type P = { id: string; name: string; status: string; fall?: { date: string | number; text: string }[]; roles?: string[] }
const people: (P & { file: string })[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) people.push({ ...p, file: f })
const records = new Map<string, { file: string; fall: { date: string | number; text: string }[] }>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const [id, r] of Object.entries((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as Record<string, { fall?: [] }>))
    records.set(id, { file: f, fall: r?.fall ?? [] })
const roster: { id: string; name: string; batch: string }[] = []
for (const f of readdirSync('research/roster').filter((f) => f.endsWith('.yaml')))
  roster.push(...((parse(readFileSync(`research/roster/${f}`, 'utf8')) ?? []) as typeof roster))

const extra = [
  '2026-05-27\tzjsc\t江西省委常委、统战部部长李伟接受中央纪委国家监委纪律审查和监察调查\thttps://www.ccdi.gov.cn/scdcn/zggb/zjsc/202605/t20260530_493361.html',
  '2026-09-21\tdjcf\t张又侠严重违纪违法被开除党籍军籍\thttps://www.ccdi.gov.cn/yaowenn/202609/t20260921_513746.html',
  '2026-09-21\tdjcf\t刘振立严重违纪违法被开除党籍军籍\thttps://www.ccdi.gov.cn/yaowenn/202609/t20260921_513746.html',
]
const rows = [...readFileSync('.probe/C15-heb.txt', 'utf8').trim().split('\n'), ...extra]
const day = (d: string) => Date.parse(String(d).length === 7 ? `${d}-15` : String(d).length === 4 ? `${d}-07-01` : String(d))
const out: string[] = []
let miss = 0
for (const row of rows) {
  const [date, col0, title, url] = row.split('\t')
  const col = /开除|处分/.test(title) ? 'djcf' : col0
  const cands = people.filter((p) => new RegExp(`${p.name}(接受|严重|涉嫌|开除|被)`).test(title) || title.includes(`给予${p.name}`))
  const ros = roster.filter((r) => new RegExp(`${r.name}(接受|严重|涉嫌|被)`).test(title) && !cands.some((c) => c.id === r.id))
  if (!cands.length) {
    out.push(`NOCARD\t${date}\t${col}\t${title}\t${url}${ros.length ? `\tROSTER ${ros.map((r) => `${r.id}/${r.batch}`).join(',')}` : ''}`)
    miss++
    continue
  }
  for (const c of cands) {
    const steps = [...(c.fall ?? []), ...(records.get(c.id)?.fall ?? [])]
    const near = steps.filter((s) => Math.abs(day(String(s.date)) - Date.parse(date)) <= 5 * 864e5)
    const last = steps.map((s) => String(s.date)).sort().at(-1) ?? ''
    const tag = near.length ? 'OK' : 'NOSTEP'
    if (!near.length) miss++
    out.push(`${tag}\t${date}\t${col}\t${c.name}\t${c.id}@${c.file}\t${c.status}\trec=${records.get(c.id)?.file ?? '-'}\tsteps=${steps.length}\tlast=${last}\t${title}`)
  }
}
writeFileSync('.probe/C15-check.txt', out.join('\n') + '\n', 'utf8')
console.log(rows.length, miss)

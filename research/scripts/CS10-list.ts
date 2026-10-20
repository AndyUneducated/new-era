// CS10 one-off: candidates for insiders-law-enforcement (政法、纪检系统自身的落马者) and central-inspection
// (巡视线索、巡视组长). Reads the same data the build does.
// Run: node research/scripts/CS10-list.ts   Writes .probe/cs10-list.txt
import { writeFileSync } from 'node:fs'
import { parseFall } from '../../src/lib/caseparse.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const out: string[] = []
const LAW = /公安|法院|检察|政法委|司法厅|司法局|司法部|国家安全|国安|监狱|劳教|610|防范和处理邪教/
const CCDI = /纪委|纪检|监察|巡视/
const caseOf = new Map<string, string[]>()
for (const c of d.cases) for (const id of c.people) caseOf.set(id, [...(caseOf.get(id) ?? []), c.id])
const rows: string[][] = []
for (const p of d.people) {
  const rec = d.falls.get(p.id)
  if (!p.fall.length && !rec) continue
  const text = (x: string) => d.texts.get(x.split('@')[0])
  const c = parseFall(p.fall, p.status, rec, text, p.name)
  const law = p.positions.filter((x) => LAW.test(x.title))
  const ccdi = p.positions.filter((x) => CCDI.test(x.title))
  const flags: string[] = []
  if (rec?.sys === 'law') flags.push('SYS-LAW')
  if (law.length) flags.push('POS-LAW')
  if (ccdi.length) flags.push('POS-CCDI')
  if (rec?.trigger?.kind === 'inspect') flags.push('TRIG-INSPECT')
  if (/巡视/.test(p.fall.map((f) => f.text).join('') + (rec?.trigger?.text ?? ''))) flags.push('TXT-XUNSHI')
  if (!flags.length) continue
  rows.push([
    flags.join(','),
    p.id,
    p.name,
    p.status,
    rec?.sys ?? '-',
    rec?.grade ?? '-',
    p.fall[0]?.date ?? '-',
    c.outcome ?? '-',
    c.term ? `${c.term}${c.years ?? ''}` : '',
    (caseOf.get(p.id) ?? []).join('|'),
    p.headline,
    [...law, ...ccdi].map((x) => `${x.title}${x.from ? ' ' + x.from : ''}${x.to ? '–' + x.to : ''}`).join('；'),
    rec?.trigger ? `${rec.trigger.kind}:${rec.trigger.text}` : '',
  ])
}
rows.sort((a, b) => a[0].localeCompare(b[0]) || a[6].localeCompare(b[6]))
out.push(`rows ${rows.length}`)
for (const r of rows) out.push(r.join('\t'))
out.push('')
out.push('## events mentioning 巡视 / 教育整顿 / 灯下黑 / 纪检监察干部')
for (const e of d.events) {
  if (/巡视|教育整顿|灯下黑|纪检监察干部|执法犯法|内鬼/.test(e.title + e.summary)) out.push(`${e.id}\t${e.date}\t${e.title}\t${e.people.join(',')}`)
}
writeFileSync('.probe/cs10-list.txt', out.join('\n') + '\n')
console.log(`rows ${rows.length}`)

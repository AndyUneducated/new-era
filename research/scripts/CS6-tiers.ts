// CS6 sentencing-tiers: bribe sums against sentences for everyone sentenced after the 2016 interpretation.
// Reads the cards and content/falls/*.yaml the way the build does (parseFall), so the sums and terms are
// the ones the site shows. Run: node research/scripts/CS6-tiers.ts --batch=CS6
// (the batch flag skips the other batches of this round, i.e. counts only integrated content).
// Writes research/scripts/CS6-tiers.txt (the table) and .probe/CS6-tiers.json.
import { mkdirSync, writeFileSync } from 'node:fs'
import { parseFall, stepOf } from '../../src/lib/caseparse.ts'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const FROM = '2016-04-18'
// the comparison sample: sentenced from 2013 up to the day before the interpretation
const BEFORE = '2013-01-01'
const d = loadAll()
interface Row {
  id: string
  name: string
  sys: string
  grade: string
  date: string
  term: string
  years?: number
  yuan?: number
  src: string
  charges: string[]
  file: string
}
const rows: Row[] = []
const early: Row[] = []
// steps that name a sentence but are not read as one (no 判 in the text), so the site misses the term
const missed: string[] = []
for (const p of d.people) {
  const rec = d.falls.get(p.id)
  if (!p.fall.length && !rec) continue
  for (const f of p.fall) if (/死刑|无期徒刑|有期徒刑/.test(f.text) && stepOf(f.text) !== 'sentenced' && !/移送|起诉|开庭|减为|减刑/.test(f.text)) missed.push(`${p.name}\t${p.id}\t${f.date}\t${f.text}`)
  // "以……罪决定执行……" is a verdict too; read it as one here (the site's parser does not, see the report)
  const reread = (t: string) => stepOf(t) !== 'sentenced' && /决定执行(死刑|无期|有期)/.test(t)
  const patched = p.fall.some((f) => reread(f.text))
  const fall = p.fall.map((f) => (reread(f.text) ? { ...f, text: `判决：${f.text}` } : f))
  const c = parseFall(fall, p.status, rec, (x) => d.texts.get(x.split('@')[0]))
  if (!c.term || !c.sentenced || c.sentenced < BEFORE) continue
  const into = c.sentenced < FROM ? early : rows
  // only graft cases: bribery or embezzlement among the charges, or a sum recorded by the court when no
  // charge is named (bribe-givers such as 贺文 have a recorded sum too, but it is what they paid)
  const graft = c.charges.some((x) => /受贿|贪污/.test(x)) || (!c.charges.length && rec?.amount)
  if (!graft) continue
  const stepSum = p.fall.some((f) => /判/.test(f.text) && /[0-9.]+\s*(亿|万)余?元/.test(f.text))
  into.push({
    id: p.id,
    name: p.name,
    sys: rec?.sys ?? '-',
    grade: rec?.grade ?? '-',
    date: c.sentenced,
    term: c.term,
    years: c.years,
    yuan: c.yuan,
    src: rec?.amount ? 'amount' : c.yuan ? (stepSum ? 'step' : 'verdict-text') : 'none',
    charges: c.charges,
    file: (rec?.file ?? 'card') + (patched ? ' 补读' : ''),
  })
}
rows.sort((a, b) => (b.yuan ?? 0) - (a.yuan ?? 0))

// sentence classes: the death penalty and its two suspended forms, life, fixed terms by length
const cls = (r: Row) =>
  r.term === 'death'
    ? '死刑立即执行'
    : r.term === 'death-life'
      ? '死缓并终身监禁'
      : r.term === 'death-suspended'
        ? '死缓'
        : r.term === 'life'
          ? '无期徒刑'
          : r.term === 'years'
            ? (r.years ?? 0) > 15
              ? '有期16年以上'
              : (r.years ?? 0) >= 10
                ? '有期10–15年'
                : '有期10年以下'
            : r.term
const CLASSES = ['死刑立即执行', '死缓并终身监禁', '死缓', '无期徒刑', '有期16年以上', '有期10–15年', '有期10年以下', 'probation', 'exempt']
// sum bands in yuan; 3 million is the 2016 line for 数额特别巨大
const BANDS: [string, number, number][] = [
  ['300万元以下', 0, 3e6],
  ['300万–1000万', 3e6, 1e7],
  ['1000万–3000万', 1e7, 3e7],
  ['3000万–5000万', 3e7, 5e7],
  ['5000万–1亿', 5e7, 1e8],
  ['1亿–2亿', 1e8, 2e8],
  ['2亿–5亿', 2e8, 5e8],
  ['5亿以上', 5e8, Infinity],
]
const band = (y?: number) => (y === undefined ? '未载金额' : BANDS.find(([, lo, hi]) => y >= lo && y < hi)![0])
const yi = (y?: number) => (y === undefined ? '' : y >= 1e8 ? `${(y / 1e8).toFixed(2)}亿` : `${(y / 1e4).toFixed(0)}万`)
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN
}

const out: string[] = []
out.push(`# CS6 量刑档次统计（${new Date().toISOString().slice(0, 10)} 运行）`)
out.push(`样本：判决日期 >= ${FROM}、罪名含受贿或贪污（或记录了法院认定金额）的人，共 ${rows.length} 人`)
out.push(`其中“决定执行”步骤由本脚本补读为判决的 ${rows.filter((r) => r.file.endsWith('补读')).length} 人；有金额 ${rows.filter((r) => r.yuan).length} 人；金额来源：amount 字段 ${rows.filter((r) => r.src === 'amount').length}，判决步骤文字 ${rows.filter((r) => r.src === 'step').length}，判决来源全文 ${rows.filter((r) => r.src === 'verdict-text').length}，无 ${rows.filter((r) => r.src === 'none').length}`)
out.push('')
out.push('## 刑种分布')
for (const k of CLASSES) {
  const g = rows.filter((r) => cls(r) === k)
  if (!g.length) continue
  const ys = g.map((r) => r.yuan).filter((x): x is number => x !== undefined)
  out.push(`${k}\t${g.length}人\t有金额${ys.length}\t中位数${yi(median(ys))}\t最低${yi(Math.min(...ys))}\t最高${yi(Math.max(...ys))}`)
}
out.push('')
out.push('## 金额档 × 刑种（人数）')
out.push(['金额档', ...CLASSES.slice(0, 7), '合计'].join('\t'))
for (const b of [...BANDS.map((x) => x[0]), '未载金额']) {
  const g = rows.filter((r) => band(r.yuan) === b)
  if (!g.length) continue
  out.push([b, ...CLASSES.slice(0, 7).map((k) => String(g.filter((r) => cls(r) === k).length)), String(g.length)].join('\t'))
}
out.push('')
out.push('## 有期徒刑年数与金额（有金额者）')
const fixed = rows.filter((r) => r.term === 'years' && r.yuan)
for (const b of BANDS.map((x) => x[0])) {
  const g = fixed.filter((r) => band(r.yuan) === b)
  if (!g.length) continue
  const ys = g.map((r) => r.years ?? 0)
  out.push(`${b}\t${g.length}人\t平均${(ys.reduce((a, x) => a + x, 0) / ys.length).toFixed(1)}年\t中位数${median(ys)}年\t最短${Math.min(...ys)}\t最长${Math.max(...ys)}`)
}
out.push('')
out.push('## 一亿元以上判有期徒刑者，与一亿元以下判死缓、无期者')
for (const r of rows.filter((r) => (r.yuan ?? 0) >= 1e8 && r.term === 'years')) out.push(`亿元以上有期\t${r.name}\t${r.id}\t${yi(r.yuan)}\t${r.years}年\t${r.date}\t${r.charges.join('、')}`)
for (const r of rows.filter((r) => r.yuan !== undefined && r.yuan < 1e8 && /death|life/.test(r.term))) out.push(`亿元以下重刑\t${r.name}\t${r.id}\t${yi(r.yuan)}\t${cls(r)}\t${r.date}\t${r.charges.join('、')}`)
out.push('')
out.push('## 按判决年份')
const years = [...new Set(rows.map((r) => r.date.slice(0, 4)))].sort()
for (const y of years) {
  const g = rows.filter((r) => r.date.startsWith(y))
  const ys = g.map((r) => r.yuan).filter((x): x is number => x !== undefined)
  out.push(`${y}\t${g.length}人\t${CLASSES.slice(0, 7).map((k) => `${k}${g.filter((r) => cls(r) === k).length}`).join(' ')}\t金额中位数${yi(median(ys))}`)
}
out.push('')
out.push('## 按级别（grade，仅有案件记录者）')
for (const gr of [...new Set(rows.map((r) => r.grade))].sort()) {
  const g = rows.filter((r) => r.grade === gr)
  const ys = g.map((r) => r.yuan).filter((x): x is number => x !== undefined)
  out.push(`${gr}\t${g.length}人\t${CLASSES.slice(0, 7).map((k) => `${k}${g.filter((r) => cls(r) === k).length}`).join(' ')}\t金额中位数${yi(median(ys))}`)
}
out.push('')
// a single charge of bribery: no other crime adds to the term
const solo = rows.filter((r) => r.charges.length === 1 && r.charges[0] === '受贿')
out.push(`## 单一受贿罪（${solo.length}人）`)
for (const k of CLASSES) {
  const g = solo.filter((r) => cls(r) === k)
  if (!g.length) continue
  const ys = g.map((r) => r.yuan).filter((x): x is number => x !== undefined)
  out.push(`${k}\t${g.length}人\t中位数${yi(median(ys))}\t最低${yi(Math.min(...ys))}\t最高${yi(Math.max(...ys))}`)
}
const soloFixed = solo.filter((r) => r.term === 'years')
out.push(`单一受贿罪的有期徒刑最长 ${Math.max(...soloFixed.map((r) => r.years ?? 0))} 年；超过15年的：${soloFixed.filter((r) => (r.years ?? 0) > 15).map((r) => `${r.name}${r.years}`).join('、') || '无'}`)
out.push(`单一受贿罪且金额>=300万判10年以下：${solo.filter((r) => r.term === 'years' && (r.yuan ?? 0) >= 3e6 && (r.years ?? 0) < 10).map((r) => `${r.name}${yi(r.yuan)}/${r.years}年`).join('、')}`)
out.push('')
// the threshold in each band: share sentenced to life or heavier
out.push('## 各金额档判无期以上的比例')
for (const b of BANDS.map((x) => x[0])) {
  const g = rows.filter((r) => band(r.yuan) === b)
  if (!g.length) continue
  const heavy = g.filter((r) => /death|life/.test(r.term)).length
  const death = g.filter((r) => /death/.test(r.term)).length
  out.push(`${b}\t${g.length}人\t无期以上${heavy}（${Math.round((heavy / g.length) * 100)}%）\t死缓以上${death}（${Math.round((death / g.length) * 100)}%）`)
}
out.push('')
// the same table split at 2022, when plain death-suspended sentences come back
for (const [label, lo, hi] of [
  ['2016-04-18 至 2021-12-31', FROM, '2022-01-01'],
  ['2022-01-01 起', '2022-01-01', '9999'],
] as const) {
  const part = rows.filter((r) => r.date >= lo && r.date < hi)
  out.push(`## 分期：${label}（${part.length}人）`)
  out.push(['金额档', ...CLASSES.slice(0, 7), '合计'].join('\t'))
  for (const b of [...BANDS.map((x) => x[0]), '未载金额']) {
    const g = part.filter((r) => band(r.yuan) === b)
    if (!g.length) continue
    out.push([b, ...CLASSES.slice(0, 7).map((k) => String(g.filter((r) => cls(r) === k).length)), String(g.length)].join('\t'))
  }
  for (const r of part.filter((r) => (r.yuan ?? 0) >= 1e8 && r.term === 'life')) out.push(`  亿元以上无期\t${r.name}\t${yi(r.yuan)}\t${r.date}`)
  out.push('')
}
out.push(`## 对照：${BEFORE} 至 ${FROM} 前判决（${early.length}人）`)
out.push(['金额档', ...CLASSES.slice(0, 7), '合计'].join('\t'))
for (const b of [...BANDS.map((x) => x[0]), '未载金额']) {
  const g = early.filter((r) => band(r.yuan) === b)
  if (!g.length) continue
  out.push([b, ...CLASSES.slice(0, 7).map((k) => String(g.filter((r) => cls(r) === k).length)), String(g.length)].join('\t'))
}
for (const r of early.sort((a, b) => (b.yuan ?? 0) - (a.yuan ?? 0))) out.push(['  ', r.name, r.id, r.date, cls(r) + (r.years ? `(${r.years})` : ''), yi(r.yuan), r.charges.join('、')].join('\t'))
out.push('')
out.push('## 数据问题：写了刑期但未被读成判决的步骤')
out.push(...missed)
out.push('## 数据问题：金额取自判决来源全文（可能不是本人受贿额）')
for (const r of [...rows, ...early].filter((r) => r.src === 'verdict-text')) out.push(`${r.name}\t${r.id}\t${yi(r.yuan)}`)
out.push('')
out.push('## 全部样本（按金额降序）')
for (const r of rows) out.push([r.name, r.id, r.grade, r.sys, r.date, cls(r) + (r.years ? `(${r.years})` : ''), yi(r.yuan), r.src, r.charges.join('、'), r.file].join('\t'))

writeFileSync(path('research', 'scripts', 'CS6-tiers.txt'), out.join('\n') + '\n')
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'CS6-tiers.json'), JSON.stringify(rows, null, 1))
console.log(`rows ${rows.length}`)

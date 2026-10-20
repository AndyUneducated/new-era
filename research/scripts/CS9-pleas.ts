// CS9 surrender-sentencing: sentences with and without the mitigating circumstances the court found
// (自首、立功、退赃、认罪), read the way the site reads them (parseFall with the person's name, so the
// verdict text behind the sentencing step is searched too). Same sample as CS6-tiers: sentenced on or
// after 2016-04-18, charges include bribery or embezzlement (or a court sum is recorded).
// Run: node research/scripts/CS9-pleas.ts   Writes research/scripts/CS9-pleas.txt
import { writeFileSync } from 'node:fs'
import { parseFall, pleasIn, stepOf } from '../../src/lib/caseparse.ts'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const FROM = '2016-04-18'
// the 2018 Criminal Procedure Law amendment wrote 认罪认罚从宽 into law (in force on promulgation)
const CPL = '2018-10-26'
const d = loadAll()
interface Row {
  id: string
  name: string
  grade: string
  date: string
  term: string
  years?: number
  yuan?: number
  charges: string[]
  pleas: string[]
  trigger?: string
  text: string
  verdict: string
}
const rows: Row[] = []
for (const p of d.people) {
  const rec = d.falls.get(p.id)
  if (!p.fall.length && !rec) continue
  const reread = (t: string) => stepOf(t) !== 'sentenced' && /决定执行(死刑|无期|有期)/.test(t)
  const fall = p.fall.map((f) => (reread(f.text) ? { ...f, text: `判决：${f.text}` } : f))
  const text = (x: string) => d.texts.get(x.split('@')[0])
  const c = parseFall(fall, p.status, rec, text, p.name)
  if (!c.term || !c.sentenced || c.sentenced < FROM) continue
  const graft = c.charges.some((x) => /受贿|贪污/.test(x)) || (!c.charges.length && rec?.amount)
  if (!graft) continue
  const sentencedSteps = fall.filter((f) => stepOf(f.text) === 'sentenced')
  rows.push({
    id: p.id,
    name: p.name,
    grade: rec?.grade ?? '-',
    date: c.sentenced,
    term: c.term,
    years: c.years,
    yuan: c.yuan,
    charges: c.charges,
    pleas: c.pleas,
    trigger: rec?.trigger?.kind,
    text: sentencedSteps.map((f) => f.text).join(' / '),
    verdict: sentencedSteps.map((f) => text(f.cite) ?? '').join('\n'),
  })
}
const BANDS: [string, number, number][] = [
  ['1000万以下', 0, 1e7],
  ['1000万–3000万', 1e7, 3e7],
  ['3000万–5000万', 3e7, 5e7],
  ['5000万–1亿', 5e7, 1e8],
  ['1亿–2亿', 1e8, 2e8],
  ['2亿以上', 2e8, Infinity],
]
const band = (y?: number) => (y === undefined ? '未载金额' : BANDS.find(([, lo, hi]) => y >= lo && y < hi)![0])
const yi = (y?: number) => (y === undefined ? '' : y >= 1e8 ? `${(y / 1e8).toFixed(2)}亿` : `${(y / 1e4).toFixed(0)}万`)
const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, x) => a + x, 0) / xs.length).toFixed(1) : '-')
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN
}
const heavy = (r: Row) => /death|life/.test(r.term)
const cls = (r: Row) => (r.term === 'years' ? `有期${r.years}` : r.term)
// groups: surrender (自首), merit (立功) without surrender, surrender or merit, refund/plea only, none at all
const G: [string, (r: Row) => boolean][] = [
  ['自首', (r) => r.pleas.includes('surrender')],
  ['立功（无自首）', (r) => r.pleas.includes('merit') && !r.pleas.includes('surrender')],
  ['自首或立功', (r) => r.pleas.includes('surrender') || r.pleas.includes('merit')],
  ['只有退赃或认罪', (r) => r.pleas.length > 0 && !r.pleas.includes('surrender') && !r.pleas.includes('merit')],
  ['读不出任何情节', (r) => r.pleas.length === 0],
]
const out: string[] = []
out.push(`# CS9 情节与刑期（${new Date().toISOString().slice(0, 10)} 运行）`)
out.push(`样本 ${rows.length} 人（判决 >= ${FROM}，罪名含受贿或贪污）；有金额 ${rows.filter((r) => r.yuan).length}`)
out.push(`情节分布：${['surrender', 'merit', 'refund', 'plea'].map((k) => `${k} ${rows.filter((r) => r.pleas.includes(k)).length}`).join('，')}；无任何情节 ${rows.filter((r) => !r.pleas.length).length}`)
out.push(`trigger=surrender（主动投案）${rows.filter((r) => r.trigger === 'surrender').length} 人，其中读出自首 ${rows.filter((r) => r.trigger === 'surrender' && r.pleas.includes('surrender')).length}`)
out.push('')
for (const [label, f] of G) {
  const g = rows.filter(f)
  const fixed = g.filter((r) => r.term === 'years')
  out.push(`## ${label}：${g.length}人，无期以上 ${g.filter(heavy).length}（${Math.round((g.filter(heavy).length / Math.max(1, g.length)) * 100)}%），有期 ${fixed.length} 人平均 ${avg(fixed.map((r) => r.years ?? 0))} 年，金额中位数 ${yi(median(g.map((r) => r.yuan).filter((x): x is number => x !== undefined)))}`)
}
out.push('')
out.push('## 金额档 × 情节组（人数 / 无期以上 / 有期平均年数）')
for (const [b] of [...BANDS, ['未载金额', 0, 0] as [string, number, number]]) {
  const inb = rows.filter((r) => band(r.yuan) === b)
  if (!inb.length) continue
  const cells = G.map(([label, f]) => {
    const g = inb.filter(f)
    const fixed = g.filter((r) => r.term === 'years')
    return `${label} ${g.length}/${g.filter(heavy).length}/${avg(fixed.map((r) => r.years ?? 0))}`
  })
  out.push(`${b}（${inb.length}）\t${cells.join('\t')}`)
}
out.push('')
// single charge of bribery only, to keep other crimes out of the term
const solo = rows.filter((r) => r.charges.length === 1 && r.charges[0] === '受贿')
out.push(`## 单一受贿罪（${solo.length}人）金额档 × 自首或立功`)
for (const [b] of BANDS) {
  const inb = solo.filter((r) => band(r.yuan) === b)
  if (!inb.length) continue
  const yes = inb.filter(G[2][1])
  const no = inb.filter((r) => !G[2][1](r))
  const fy = (g: Row[]) => g.filter((r) => r.term === 'years').map((r) => r.years ?? 0)
  out.push(`${b}\t有自首或立功 ${yes.length}人 无期以上${yes.filter(heavy).length} 有期平均${avg(fy(yes))}年（中位${median(fy(yes))}）\t无 ${no.length}人 无期以上${no.filter(heavy).length} 有期平均${avg(fy(no))}年（中位${median(fy(no))}）`)
}
out.push('')
out.push('## 判决前后：2018-10-26 认罪认罚入法')
for (const [label, lo, hi] of [
  ['入法前', FROM, CPL],
  ['入法后', CPL, '9999'],
] as const) {
  const g = rows.filter((r) => r.date >= lo && r.date < hi)
  const rf = g.filter((r) => /认罪认罚/.test(r.text) || /认罪认罚/.test(r.verdict.split(/[。\n]/).filter((s) => s.includes(r.name)).join('')))
  out.push(`${label}（${g.length}人）：判决文字或来源中本人句子写“认罪认罚” ${rf.length} 人；${['surrender', 'merit', 'refund', 'plea'].map((k) => `${k} ${g.filter((r) => r.pleas.includes(k)).length}`).join('，')}；无情节 ${g.filter((r) => !r.pleas.length).length}`)
}
out.push('')
out.push('## 按判决年份：有自首 / 有立功 / 有认罪 / 无情节')
for (const y of [...new Set(rows.map((r) => r.date.slice(0, 4)))].sort()) {
  const g = rows.filter((r) => r.date.startsWith(y))
  out.push(`${y}\t${g.length}\t自首${g.filter((r) => r.pleas.includes('surrender')).length}\t立功${g.filter((r) => r.pleas.includes('merit')).length}\t退赃${g.filter((r) => r.pleas.includes('refund')).length}\t认罪${g.filter((r) => r.pleas.includes('plea')).length}\t认罪认罚字样${g.filter((r) => /认罪认罚/.test(r.verdict.split(/[。\n]/).filter((s) => s.includes(r.name)).join('') + r.text)).length}\t无${g.filter((r) => !r.pleas.length).length}`)
}
out.push('')
out.push('## 有自首者（按金额）')
for (const r of rows.filter((r) => r.pleas.includes('surrender')).sort((a, b) => (b.yuan ?? 0) - (a.yuan ?? 0)))
  out.push([r.name, r.id, r.grade, r.date, cls(r), yi(r.yuan), r.charges.join('、'), r.pleas.join(','), r.trigger ?? ''].join('\t'))
out.push('')
out.push('## 有立功而无自首者')
for (const r of rows.filter(G[1][1]).sort((a, b) => (b.yuan ?? 0) - (a.yuan ?? 0)))
  out.push([r.name, r.id, r.grade, r.date, cls(r), yi(r.yuan), r.charges.join('、'), r.pleas.join(',')].join('\t'))
out.push('')
out.push('## trigger=surrender 而未读出自首')
for (const r of rows.filter((r) => r.trigger === 'surrender' && !r.pleas.includes('surrender')))
  out.push([r.name, r.id, r.date, cls(r), yi(r.yuan), r.pleas.join(',')].join('\t'))
out.push('')
out.push('## 法院措辞样本：来源中含本人名字且含 从轻/减轻 的句子')
for (const r of rows.filter((r) => r.pleas.length)) {
  const ss = r.verdict.split(/[。\n]/).filter((s) => s.includes(r.name) && /从轻|减轻/.test(s))
  for (const s of ss.slice(0, 2)) out.push(`${r.name}\t${r.id}\t${s.trim().slice(0, 260)}`)
}
// turned themselves in (投案) versus a confession counted as 自首 only for one of several crimes, or for
// facts the investigators did not have (准自首); read from the verdict sentences naming them
// The site reads only verdict sentences that name the defendant; a court report that says "鉴于其……" is
// missed (罗保铭). This script also reads sentences with 鉴于其, and counts as turned in anyone whose record
// says 主动投案 (trigger) or whose verdict says 自动投案/主动投案/主动到案, whether or not the court wrote 自首.
const mine = (r: Row) => r.verdict.split(/[。\n]/).filter((s) => s.includes(r.name) || s.includes('鉴于其')).join('。') + '。' + r.text
const extra = new Map<string, string[]>()
for (const r of rows) {
  const add = pleasIn(r.verdict.split(/[。\n]/).filter((s) => s.includes('鉴于其') && !s.includes(r.name)).join('。')).filter((k) => !r.pleas.includes(k))
  if (add.length) extra.set(r.id, add)
}
const P = (r: Row) => [...r.pleas, ...(extra.get(r.id) ?? [])]
const turnedIn = (r: Row) => r.trigger === 'surrender' || /(?:自动|主动)(?:到案|投案)|携带赃款赃物主动/.test(mine(r))
const partial = (r: Row) => P(r).includes('surrender') && !turnedIn(r)
const merit = (r: Row) => P(r).includes('merit') && !P(r).includes('surrender') && !turnedIn(r)
const neither = (r: Row) => !P(r).includes('surrender') && !P(r).includes('merit') && !turnedIn(r)
const H: [string, (r: Row) => boolean][] = [
  ['投案自首', turnedIn],
  ['其他自首（一罪自首或准自首）', partial],
  ['立功无自首', merit],
  ['无自首无立功', neither],
]
out.push('')
out.push('## 二次分组（全样本）')
for (const [label, f] of H) {
  const g = rows.filter(f)
  const fixed = g.filter((r) => r.term === 'years')
  out.push(`${label}\t${g.length}人\t无期以上${g.filter(heavy).length}\t有期${fixed.length}人平均${avg(fixed.map((r) => r.years ?? 0))}年 中位${median(fixed.map((r) => r.years ?? 0))}\t金额中位${yi(median(g.map((r) => r.yuan).filter((x): x is number => x !== undefined)))}`)
}
out.push('')
out.push(`## 二次分组 × 金额档（单一受贿罪 ${solo.length} 人）：人数 / 无期以上 / 有期平均 / 有期中位`)
for (const [b] of BANDS) {
  const inb = solo.filter((r) => band(r.yuan) === b)
  if (!inb.length) continue
  out.push(`${b}（${inb.length}）\t` + H.map(([label, f]) => {
    const g = inb.filter(f)
    const ys = g.filter((r) => r.term === 'years').map((r) => r.years ?? 0)
    return `${label} ${g.length}/${g.filter(heavy).length}/${avg(ys)}/${median(ys)}`
  }).join('\t'))
}
out.push('')
out.push('## 二次分组 × 金额档（全样本）')
for (const [b] of BANDS) {
  const inb = rows.filter((r) => band(r.yuan) === b)
  if (!inb.length) continue
  out.push(`${b}（${inb.length}）\t` + H.map(([label, f]) => {
    const g = inb.filter(f)
    const ys = g.filter((r) => r.term === 'years').map((r) => r.years ?? 0)
    return `${label} ${g.length}/${g.filter(heavy).length}/${avg(ys)}/${median(ys)}`
  }).join('\t'))
}
out.push('')
out.push('## 投案者（含法院未写自首者）')
for (const r of rows.filter(turnedIn).sort((a, b) => (b.yuan ?? 0) - (a.yuan ?? 0)))
  out.push([r.name, r.id, r.grade, r.date, cls(r), yi(r.yuan), r.charges.join('、'), P(r).join(','), r.trigger ?? '', /自首/.test(mine(r)) ? '写自首' : '未写自首'].join('\t'))
out.push('')
out.push('## 补读“鉴于其”后新增的情节')
for (const [id, add] of extra) out.push(`${id}\t${add.join(',')}`)
out.push('')
out.push('## 写有“认罪认罚”的')
for (const r of rows.filter((r) => /认罪认罚/.test(mine(r)))) out.push([r.name, r.id, r.date, cls(r), yi(r.yuan)].join('\t'))
out.push('')
out.push('## 读不出任何情节者')
for (const r of rows.filter((r) => !r.pleas.length)) out.push([r.name, r.id, r.grade, r.date, cls(r), yi(r.yuan), r.charges.join('、'), r.verdict ? 'has-text' : 'no-text'].join('\t'))
writeFileSync(path('research', 'scripts', 'CS9-pleas.txt'), out.join('\n') + '\n')
console.log(`rows ${rows.length}`)

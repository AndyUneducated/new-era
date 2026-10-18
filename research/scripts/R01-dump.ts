// For each person in research/falls-list/R01.yaml with a card: the expulsion notice in full, the verdict
// sentences that carry sums, and sentences in any of the card's sources that hint at a trigger or a patron.
// Output .probe/R01-dump.txt. Usage: node research/scripts/R01-dump.ts [from] [to]   (row indexes)
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { parse } from 'yaml'

const list = parse(readFileSync('research/falls-list/R01.yaml', 'utf8')) as { name: string; id: string }[]
const cards = new Map<string, any>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as any[]) cards.set(p.id, { ...p, file: f })
}
const texts = new Set(readdirSync('sources/text').map((f) => f.replace(/\.txt$/, '')))
const read = (id: string) => (texts.has(id) ? readFileSync(`sources/text/${id}.txt`, 'utf8') : '')
const NOTICE: Record<string, string> = {
  'li-chuncheng': 'c03-xinhua-2014-04-29-li-chuncheng-expel',
  'liu-tienan': 'c03-ccdi-2013-08-08-liu-tienan-expel',
  'guo-yongxiang': 'c07-people-2014-04-09-guo-yongxiang',
  'jiang-jiemin': 'c03-cyol-2014-07-01-jiang-li-expel',
  'li-dongsheng': 'c03-cyol-2014-07-01-jiang-li-expel',
  'wang-yongchun': 'c03-cyol-2014-07-01-jiang-li-expel',
  'ji-jianye': 'f05-sdnews-2014-01-30-ji-jianye',
  'ji-wenlin': 'c07-people-2014-07-02-ji-wenlin',
  'su-rong': 'c03-ccdi-2015-02-16-su-rong-expel',
  'wan-qingliang': 'c03-ccdi-2014-10-09-wan-qingliang-expel',
  'zhang-tianxin': 't01-ccdi-2014-07-16-zhang-tianxin-expel',
  'zhou-yongkang': 'b03-people-2014-12-06-zhou-expelled',
  'bai-enpei': 'c03-people-2015-01-13-bai-enpei-expel',
  'zhu-mingguo': 'c03-ccdi-2015-02-17-zhu-mingguo-expel',
  'ling-jihua': 'b07-xinhua-2015-07-20-ling-expulsion',
  'zhao-shaolin': 'f05-chinanews-2015-08-14-zhao-shaolin',
}
const slug = (id: string) => id.replace(/-jinan$/, '')
const findNotice = (id: string) =>
  NOTICE[id] ?? [...texts].find((t) => t.startsWith('r01-ccdi-') && t.endsWith(`-${slug(id)}-expel`)) ?? ''
const HINT = /巡视|举报|牵出|牵连|秘书|周永康|令计划|苏荣|薄熙来|徐才厚|团团伙伙|政治|帮派|窝案|塌方|西山会|石油帮|秘书帮|老乡|靠山|商人|妻子|儿子|弟弟|哥哥|情妇|亲属/
const sentences = (t: string) => t.split(/(?<=[。；！？])/).map((s) => s.trim()).filter(Boolean)

const [from, to] = [Number(process.argv[2] ?? 0), Number(process.argv[3] ?? list.length)]
const out: string[] = []
for (const row of list.slice(from, to)) {
  out.push(`\n######## ${row.name} ${row.id}`)
  const c = cards.get(row.id)
  if (!c) { out.push('  (no card)'); continue }
  out.push(`  ${c.file} status=${c.status} roles=${c.roles} born=${c.born ?? ''} headline=${c.headline}`)
  for (const s of c.fall ?? []) out.push(`  FALL ${s.date} ${s.text} [${s.cite}]`)
  const n = findNotice(row.id)
  out.push(`  NOTICE ${n || '(none)'}`)
  if (n) out.push(read(n).trim().split('\n').filter(Boolean).map((l) => '    | ' + l).join('\n'))
  const verdicts = (c.fall ?? []).filter((s: any) => /判|裁定/.test(s.text)).map((s: any) => s.cite)
  for (const v of verdicts) {
    const t = read(v)
    if (!t) { out.push(`  VERDICT ${v} (no text)`); continue }
    out.push(`  VERDICT ${v}`)
    const lines = t.split('\n').map((l) => l.trim()).filter(Boolean)
    const k = lines.findIndex((l) => l.endsWith(row.name) && l.length < 40)
    if (k >= 0) { out.push('    > ROW ' + lines.slice(k, k + 4).join(' | ')); continue }
    for (const s of sentences(t.replace(/\n+/g, ' ')).filter((s) => s.includes(row.name) || /受贿|贪污/.test(s)).filter((s) => /万|亿/.test(s)).slice(0, 4))
      out.push('    > ' + s.slice(0, 300))
  }
  const seen = new Set<string>()
  for (const id of new Set([...(c.cites ?? []), ...(c.fall ?? []).map((s: any) => s.cite)])) {
    if (id === n || id.startsWith('wd-')) continue
    for (const s of sentences(read(id).replace(/\n+/g, ' ')).filter((s) => s.includes(row.name) && HINT.test(s)).slice(0, 2)) {
      if (seen.has(s)) continue
      seen.add(s)
      out.push(`    ? [${id}] ${s.slice(0, 260)}`)
    }
  }
}
writeFileSync('.probe/R01-dump.txt', out.join('\n'))
console.log('rows', to - from, existsSync('.probe/R01-dump.txt'))

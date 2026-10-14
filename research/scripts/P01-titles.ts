// P01 one-off: resolve zh.wikipedia titles of the provincial secretary / governor list pages.
import { writeFileSync } from 'node:fs'

const provs: [string, string, string][] = [
  ['北京', '北京市', '市长'], ['天津', '天津市', '市长'], ['河北', '河北省', '省长'], ['山西', '山西省', '省长'],
  ['内蒙古', '内蒙古自治区', '主席'], ['辽宁', '辽宁省', '省长'], ['吉林', '吉林省', '省长'], ['黑龙江', '黑龙江省', '省长'],
  ['上海', '上海市', '市长'], ['江苏', '江苏省', '省长'], ['浙江', '浙江省', '省长'], ['安徽', '安徽省', '省长'],
  ['福建', '福建省', '省长'], ['江西', '江西省', '省长'], ['山东', '山东省', '省长'],
]
const cands: string[] = []
for (const [, full, g] of provs) {
  const party = full === '内蒙古自治区' ? '中国共产党内蒙古自治区委员会' : `中国共产党${full}委员会`
  const short = full.replace(/(省|市|自治区)$/, '')
  cands.push(party, `${short}行政长官列表`, `${full}${g}列表`, `${short}省委书记列表`, `${party}书记列表`)
}
const out: string[] = []
for (let i = 0; i < cands.length; i += 40) {
  const titles = cands.slice(i, i + 40).join('|')
  const url = `https://zh.wikipedia.org/w/api.php?action=query&format=json&redirects=1&titles=${encodeURIComponent(titles)}`
  const r = await fetch(url, { headers: { 'User-Agent': 'new-era-research/0.1' } })
  const j = (await r.json()) as any
  for (const n of j.query.normalized ?? []) out.push(`norm ${n.from} -> ${n.to}`)
  for (const n of j.query.redirects ?? []) out.push(`redir ${n.from} -> ${n.to}`)
  for (const p of Object.values(j.query.pages) as any[]) out.push(`${p.missing !== undefined ? 'MISSING' : 'OK     '} ${p.title}`)
}
writeFileSync('.probe/P01-titles2.txt', out.join('\n') + '\n')

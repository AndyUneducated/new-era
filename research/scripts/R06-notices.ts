// Research digest: for each R06 person, the notice paragraph (经查…) and discipline line, and the verdict sentence
// with the sum, read from sources/text. Output: .probe/R06-notices.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const notices: Record<string, string> = {
  'ma-xingrui': 'b08-xinhua-2026-07-14-ma-expelled',
  'ding-yexian': 'k05-xinhua-2026-10-09-ding-yexian',
  'lei-siwei': 'r06-xinhua-2026-09-11-lei-siwei-expel',
  'wang-xiangxi': 'c03-xinhua-2026-09-08-wang-xiangxi-expel',
  'sun-shaocheng': 'c03-xinhua-2026-09-09-sun-shaocheng-expel',
  'gu-jun': 't02-xinhua-2026-07-25-gu-jun-expel',
  'ye-hongzhuan': 'k04-xinhua-2026-06-05-ye-hongzhuan-expel',
  'chen-weijun': 't02-xinhua-2026-06-08-chen-weijun-expel',
  'wang-fengchao': 'r06-xinhua-2026-06-05-wang-fengchao-expel',
  'fang-hongwei': 'k06-xinhua-2026-07-07-fang-hongwei-expelled',
  'jiang-duntao': 'r06-xinhua-2026-04-13-jiang-duntao-expel',
  'wu-lan': 'k04-xinhua-2026-04-13-wu-lan-expel',
  'lin-jingzhen': 't02-thepaper-2026-02-06-lin-jingzhen-expel',
  'yi-huiman': 'c03-xinhua-2026-04-30-yi-huiman-expel',
  'wang-lixia': 'k05-xinhua-2026-02-12-wang-lixia',
  'wu-shenghua': 'k05-chinanews-2026-01-07-wu-shenghua',
  'liu-hui': 'k04-xinhua-2026-03-26-liu-hui-expel',
  'feng-zhibin': 'r06-people-2026-01-04-feng-zhibin-expel',
  'liu-shaoyong': 't02-xinhua-2026-01-04-liu-shaoyong-expel',
  'ni-qiang': 'r06-xinhua-2026-02-06-ni-qiang-expel',
  'fei-dongbin': 'k06-xinhua-2025-12-05-fei-dongbin-expelled',
  'bi-jingquan': 'k05-xinhua-2025-12-08-bi-jingquan',
  'ye-hanbing': 'r06-xinhua-2025-11-24-ye-hanbing-expel',
  'lan-tianli': 'k04-xinhua-2025-12-04-lan-tianli-expel',
  'jin-xiangjun': 'c03-xinhua-2025-10-10-jin-xiangjun-expel',
  'zhou-derui': 'r06-xinhua-2025-09-04-zhou-derui-expel',
  'chen-shifei': 'r06-xinhua-2025-07-30-chen-shifei-expel',
  'jiang-chaoliang': 'k04-xinhua-2025-10-27-jiang-chaoliang-expel',
  'qi-zhala': 'k05-chinanews-2025-07-22-qi-zhala',
  'kou-wei': 'k05-chinanews-2025-06-06-kou-wei',
  'wu-cunrong': 'k05-xinhua-2025-06-05-wu-cunrong',
  'luo-zengbin': 't02-xinhua-2025-05-27-luo-zengbin-expel',
  'zhu-zhisong': 'f08-people-2025-06-10-zhu-zhisong',
  'zhang-gengsheng': 'r06-xinhua-2025-04-23-zhang-gengsheng-expel',
  'lu-kehua': 'r06-xinhua-2025-04-23-lu-kehua-expel',
  'zhang-xiaolian': 't02-ccdi-2025-04-23-zhang-xiaolian-expel',
  'yang-fasen': 'k06-xinhua-2025-03-03-yang-fasen-expelled',
  'qi-tongsheng': 'r06-xinhua-2025-03-14-qi-tongsheng-expel',
  'sun-yuning': 'r06-xinhua-2025-03-14-sun-yuning-expel',
  'du-yubo': 'r06-people-2025-03-02-du-yubo-expel',
  'tan-ruisong': 't02-ccdi-2025-02-24-tan-ruisong-expel',
  'li-weiwei': 't02-xinhua-2025-01-24-li-weiwei-expel',
  'luo-baoming': 'k03-xinhua-2025-01-24-luo-baoming-expel',
  'li-shisong': 'k06-xinhua-2024-12-17-li-shisong-expelled',
  'zhang-jianchun': 't02-ccdi-2024-12-10-zhang-jianchun-expel',
  'wu-yingjie': 'k05-xinhua-2024-12-10-wu-yingjie',
  'gou-zhongwen': 'r06-rmrb-2024-12-12-gou-zhongwen-expel',
  'tang-renjian': 'c03-xinhua-2024-11-15-tang-renjian-expel',
  'lou-wenlong': 't02-people-2024-11-21-lou-wenlong-expel',
  'gao-peng-beijing': 'r06-xinhua-2024-10-22-gao-peng-expel',
  'tang-yijun': 'f07-ccdi-2024-10-07-tang-yijun',
  'liu-yuejin-mps': 't02-bjnews-2024-09-11-three-expel',
  'li-xiangang': 't02-bjnews-2024-09-11-three-expel',
  'li-yong-cnooc': 't02-bjnews-2024-09-11-three-expel',
  'wang-yilin': 't02-ccdi-2024-07-31-wang-yilin-expel',
  'qin-rupei': 'r06-xinhua-2024-10-11-qin-rupei-expel',
  'li-yuefeng': 'r06-people-2024-10-11-li-yuefeng-dismissed',
}
const text = (id: string) => (existsSync(`sources/text/${id}.txt`) ? readFileSync(`sources/text/${id}.txt`, 'utf8') : '')
const people = new Map<string, { name: string; fall?: { date: string; text: string; cite: string }[] }>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as { id: string; name: string }[]) people.set(p.id, p)
const out: string[] = []
for (const [id, cite] of Object.entries(notices)) {
  const p = people.get(id)
  const t = text(cite).replace(/&emsp;/g, '')
  const name = p?.name ?? id
  const paras = t.split(/\n+/).filter((x) => x.includes('经查') || /严重违反|已构成/.test(x))
  const own = id === 'liu-yuejin-mps' || id === 'li-xiangang' || id === 'li-yong-cnooc' ? paras.filter((x) => x.includes(name)) : paras
  out.push(`== ${id} ${name} <${cite} ${t.length}>`, ...own.map((x) => `   ${x.trim()}`))
  for (const s of p?.fall ?? []) {
    if (!/判处|宣判|判决/.test(s.text)) continue
    const v = text(s.cite)
    const sums = v.match(/[^。；]*(?:共计|折合|收受)[^。；]*?[0-9.]+\s*(?:亿|万)余?元[^。；]*/g) ?? []
    out.push(`   V ${s.date} <${s.cite}> ${s.text}`, ...sums.slice(0, 3).map((x) => `     $ ${x.trim()}`))
  }
}
writeFileSync('.probe/R06-notices.txt', out.join('\n') + '\n')
console.log(out.length)

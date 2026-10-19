// One-off: turn the Wikipedia references in .probe/R04-refs.json into draft manifest entries for R04
// (.probe/R04-manifest-draft.yaml). Wayback raw snapshots (id_) are used where Wikipedia gives an archive.
import { readFileSync, writeFileSync } from 'node:fs'

const slug: Record<string, string> = {
  刘君: 'liu-jun-gx', 王晓光: 'wang-xiaoguang', 白向群: 'bai-xiangqun', 孙波: 'sun-bo-csic', 艾文礼: 'ai-wenli', 陈质枫: 'chen-zhifeng',
  王铁: 'wang-tie', 王尔智: 'wang-erzhi', 靳绥东: 'jin-suidong', 邢云: 'xing-yun', 缪瑞林: 'miao-ruilin', 李建华: 'li-jianhua-gs',
  张茂才: 'zhang-maocai', 魏传忠: 'wei-chuanzhong', 彭宇行: 'peng-yuxing', 向力力: 'xiang-lili', 云光中: 'yun-guangzhong',
  杨克勤: 'yang-keqin', 徐光: 'xu-guang-hn', 张坚: 'zhang-jian-ah', 李谦: 'li-qian-hb', 张琦: 'zhang-qi-hk', 姜国文: 'jiang-guowen',
  李庆奎: 'li-qingkui', 马明: 'ma-ming-nm', 赵仕杰: 'zhao-shijie', 陈国强: 'chen-guoqiang', 张和: 'zhang-he-hb', 任华: 'ren-hua',
  刘国强: 'liu-guoqiang', 王勇: 'wang-yong-hi', 李伟: 'li-wei-bj', 文国栋: 'wen-guodong', 史文清: 'shi-wenqing', 董宏: 'dong-hong',
  童道驰: 'tong-daochi',
  // existing cards that lack a step
  钱引安: 'qian-yinan', 李贻煌: 'li-yihuang', 胡问鸣: 'hu-wenming', 胡怀邦: 'hu-huaibang',
}
const pubOf = (u: string): [string, string] => {
  const h = u.replace(/^https?:\/\/web\.archive\.org\/web\/\d+(id_)?\//, '')
  const table: [RegExp, string, string][] = [
    [/ccdi\.gov\.cn/, 'ccdi', '中央纪委国家监委网站'],
    [/xinhuanet\.com|news\.cn/, 'xinhua', '新华网'],
    [/people\.com\.cn/, 'people', '人民网'],
    [/chinanews\.com/, 'chinanews', '中国新闻网'],
    [/court\.gov\.cn|chinacourt/, 'court', '中国法院网'],
    [/spp\.gov\.cn/, 'spp', '最高人民检察院网站'],
    [/gov\.cn/, 'gov', '中国政府网'],
    [/bjnews/, 'bjnews', '新京报'],
    [/yicai/, 'yicai', '第一财经'],
    [/thepaper/, 'thepaper', '澎湃新闻'],
    [/sina/, 'sina', '新浪'],
    [/xhby/, 'xhby', '新华报业网'],
    [/cnwest/, 'cnwest', '西部网'],
    [/hexun/, 'hexun', '和讯网'],
    [/nbd\.com/, 'nbd', '每日经济新闻'],
    [/zaobao/, 'zaobao', '联合早报'],
    [/enorth/, 'enorth', '北方网'],
    [/scol/, 'scol', '四川在线'],
    [/ce\.cn/, 'ce', '中国经济网'],
    [/hk01/, 'hk01', '香港01'],
    [/sohu/, 'sohu', '搜狐'],
    [/caixin/, 'caixin', '财新网'],
  ]
  for (const [re, k, p] of table) if (re.test(h)) return [k, p]
  return ['web', '']
}
const dateOf = (u: string, fallback?: string): string => {
  const m = u.match(/t(20\d{2})(\d{2})(\d{2})_/) ?? u.match(/\/(20\d{2})-(\d{2})\/(\d{2})\//) ?? u.match(/\/(20\d{2})\/(\d{2})-(\d{2})\//) ?? u.match(/\/(20\d{2})\/(\d{2})(\d{2})\//)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return fallback && /^\d{4}-\d{2}-\d{2}$/.test(fallback) ? fallback : 'XXXX'
}
const kindOf = (t: string) => (/宣判|获刑|判刑|被判|判处|一审/.test(t) ? 'verdict' : /开除|处分|双开/.test(t) ? 'expel' : 'probe')

type Ref = { url: string; title?: string; date?: string; archive?: string; known?: string; knownArchive?: string }
const rows: { name: string; refs: Ref[] }[] = JSON.parse(readFileSync('.probe/R04-refs.json', 'utf8'))
const out: string[] = ['web:']
for (const r of rows) {
  const s = slug[r.name]
  if (!s) continue
  out.push(`  # ---- ${r.name} ----`)
  for (const f of r.refs) {
    if (f.known || f.knownArchive) {
      out.push(`  # known: ${f.known ?? f.knownArchive}  ${f.title}`)
      continue
    }
    const url = f.archive ? f.archive.replace(/\/web\/(\d+)\//, '/web/$1id_/') : f.url
    const [k, pub] = pubOf(f.url)
    const d = dateOf(f.url, f.date)
    const kind = kindOf(f.title ?? '')
    out.push(`  - id: r04-${k}-${d}-${s}-${kind}`)
    out.push(`    title: ${JSON.stringify(f.title ?? '')}`)
    out.push(`    publisher: ${pub}`)
    out.push(`    date: ${d}`)
    out.push(`    voice: official`)
    out.push(`    url: ${JSON.stringify(url)}`)
  }
}
writeFileSync('.probe/R04-manifest-draft.yaml', out.join('\n') + '\n', 'utf8')
console.log(out.filter((l) => l.startsWith('  - id')).length, 'entries')

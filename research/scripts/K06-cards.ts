// Builds content/people/K06.yaml and research/roster/K06.yaml from
//   .probe/K06-data.json  (the 20th-list biography tables on Wikipedia, joined with the roster)
//   .probe/K06-picks.json (Wikidata picks) + research/wikidata/Q*.json
//   .probe/K06-wiki.json  (person -> Wikipedia source id) + sources/text/<id>.txt (lead paragraph)
//   research/scripts/K06-overrides.ts (falls, deaths, unexplained exits, hand-written bios)
// node research/scripts/K06-cards.ts  ->  also .probe/K06-cards.txt (conflicts and gaps)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PICKS } from './K06-ids.ts'
import { OV, PROMOTED } from './K06-overrides.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (...p: string[]) => readFileSync(join(ROOT, ...p), 'utf8')

type Row = { name: string; key: string; id: string; list: 'cc' | 'cca'; gender?: 'm' | 'f'; ethnicity?: string; rank?: string; lines: string[]; born?: string; level?: string; kind?: string }
type Pos = { title: string; sys: 'party' | 'gov' | 'army' | 'other'; place?: string; from?: string; to?: string; cite: string }
type WD = { qid: string; born?: string; birthplace?: string; positions?: { label: string; from?: string; to?: string }[] }

const data = JSON.parse(read('.probe', 'K06-data.json')) as Row[]
const picks = JSON.parse(read('.probe', 'K06-picks.json')) as Record<string, { qid?: string }>
const wikiIds = JSON.parse(read('.probe', 'K06-wiki.json')) as Record<string, string>
const report: string[] = []
// official resumes (already fetched, any batch) used when the wiki text is thin
const EXTRA: Record<string, string> = {
  'wang-qingxian': 'p01-people-2021-02-02-wang-qingxian',
  'ren-zhenhe': 'p02-xinhua-2020-12-03-ren-zhenhe-acting',
  'wang-kai-henan': 'k06-people-2021-06-17-wang-kai',
  'wang-yubo': 'k06-ynrd-2021-01-29-wang-yubo',
  'wang-zhengpu': 'k06-cctv-2021-10-21-wang-zhengpu',
  'wang-shouwen': 'k06-ce-2018-02-05-wang-shouwen',
  'feng-fei': 'k06-hndaily-2020-12-03-feng-fei',
  'liu-xiaoming': 'k06-ce-2021-03-26-liu-xiaoming',
  'hu-yuting': 'k06-bjd-2021-06-25-hu-yuting',
  'liang-huiling': 'k06-hbjjrb-2018-01-30-liang-huiling',
  'wei-tao': 'k06-liuzhou-2025-07-18-wei-tao',
  'bao-gang': 'k06-rmzxw-2018-07-27-bao-gang',
  'gao-zhidan': 'k06-rednet-2022-07-29-gao-zhidan', 'meng-fanli': 'k06-nbd-2022-04-19-meng-fanli',
  'li-xiaoxin': 'k06-sina-2022-04-30-li-xiaoxin',
}

const PROVS = ['北京', '天津', '上海', '重庆', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '广西', '海南', '四川', '贵州', '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆']
const CITY: Record<string, string> = {
  开封: '河南', 兰考: '河南', 平顶山: '河南', 焦作: '河南', 郑州: '河南', 黔东南: '贵州', 贵阳: '贵州', 延边: '吉林', 喀什: '新疆', 乌鲁木齐: '新疆',
  崇左: '广西', 南宁: '广西', 厦门: '福建', 福州: '福建', 南昌: '江西', 宁波: '浙江', 杭州: '浙江', 曲靖: '云南', 昆明: '云南', 西安: '陕西',
  合肥: '安徽', 石家庄: '河北', 雄安: '河北', 大同: '山西', 太原: '山西', 万州: '重庆', 呼和浩特: '内蒙古', 兰州: '甘肃', 西宁: '青海', 拉萨: '西藏',
  哈尔滨: '黑龙江', 济南: '山东', 青岛: '山东', 武汉: '湖北', 广州: '广东', 深圳: '广东', 沈阳: '辽宁', 大连: '辽宁', 南京: '江苏', 成都: '四川',
  银川: '宁夏', 长沙: '湖南', 玉林: '广西', 梧州: '广西', 柳州: '广西', 乌海: '内蒙古', 包头: '内蒙古', 阿拉善: '内蒙古', 辽阳: '辽宁', 晋中: '山西', 鄂州: '湖北', 孝感: '湖北', 襄阳: '湖北', 长春: '吉林', 滨海新区: '天津', 虹口: '上海', 房山: '北京', 通州: '北京', 香港: '香港',
}
// province of the bare county/city labels Wikidata gives as place of birth
const BPPROV: Record<string, string> = {
  单县: '山东', 临朐: '山东', 费县: '山东', 长清: '山东济南', 临沂: '山东', 高青: '山东', 烟台: '山东', 桓台: '山东',
  阜新: '辽宁', 盘锦: '辽宁', 康平: '辽宁', 五台: '山西', 宜城: '湖北', 监利: '湖北', 鹤峰: '湖北', 惠东: '广东',
  罗城: '广西', 天等: '广西', 牡丹江: '黑龙江', 上蔡: '河南', 镇平: '河南', 丹阳: '江苏', 扬中: '江苏', 衡阳: '湖南',
  江孜: '西藏', 江达: '西藏', 泗县: '安徽', 平安: '青海', 延边: '吉林', 都昌: '江西', 永年: '河北',
}
function placeOf(title: string, army: boolean): string | undefined {
  if (army && !/军区|卫戍区|总队/.test(title)) return undefined
  const head = title.split(/[、，]/)[0]
  for (const p of PROVS) if (head.startsWith(p) || head.startsWith('中共' + p)) return p
  for (const [c, p] of Object.entries(CITY)) if (head.startsWith(c) || head.includes(c + '市') || head.includes(c + '区')) return p === '香港' ? undefined : p
  for (const p of PROVS) if (title.startsWith(p)) return p
  return undefined
}
function sysOf(title: string, army: boolean): Pos['sys'] {
  if (army) return 'army'
  if (/人民银行/.test(title)) return 'gov'
  const head = title.split(/[、，]/)[0]
  if (/集团|公司|银行|大学|学院|研究院|科学院|工程院|协会|联合会|总工会|残联|联谊会|实验室|天文台|钻井|日报社|通讯社|探测|研究所|中心主任|管网/.test(head)) return 'other'
  if (/(省|市|区|州|县|盟)委(副)?书记|党委(副)?书记/.test(title) && !/政府|省长|市长|主席|总局|总署|委员会党|证监会|人民银行|国务院/.test(title.replace(/自治区党委/g, '自治区省委'))) return 'party'
  if (/^中央|^中共|组织部|宣传部|统战部|政法委|社会工作部|对外联络部|纪委|教育工委|党校|省委秘书长|市委秘书长/.test(title) && !/国务院|政府|人大|政协/.test(title)) return 'party'
  if (/政府|国务院|人大常委会|人大|政协|法院|检察院|总署|审计署|证监会|中联办|特派员|部长|主任|局长|省长|市长|州长|县长|盟长|镇长|厅长|总督学|主席|秘书长|社长|院长|署长|审计长/.test(title)) return 'gov'
  if (/书记|党|常委/.test(title)) return 'party'
  return 'other'
}
const ym = (s: string) => {
  const m = s.match(/^(\d{4})(?:\.(\d{1,2}))?$/)
  return m ? (m[2] ? `${m[1]}-${m[2].padStart(2, '0')}` : m[1]) : undefined
}
function parseLine(l: string): { title: string; from?: string; to?: string } | undefined {
  l = l.replace(/\[注\s*\d+\]/g, '').trim()
  if (!l || l === '—' || /^(学者|基层)$/.test(l) || /^（/.test(l)) return undefined
  if (/^\d{4}年.*(被查|双开|逝世|罢免|开除)/.test(l)) return undefined
  if (/院士|专家$|学家$/.test(l) && !/—/.test(l)) return undefined
  let m = l.match(/^(\d{4}(?:\.\d{1,2})?)?—(\d{4}(?:\.\d{1,2})?)?\s*(.+)$/)
  if (m) {
    const title = m[3].replace(/^[.\s]+/, '').trim()
    return /^（/.test(title) ? undefined : { title, from: m[1] && ym(m[1]), to: m[2] && ym(m[2]) }
  }
  m = l.match(/^(\d{4}\.\d{1,2})\s+(.+)$/)
  if (m) return { title: m[2].trim(), from: ym(m[1]) }
  return { title: l }
}
const fmt = (d: string) => {
  const [y, m] = d.split('-')
  return m ? `${y} 年 ${Number(m)} 月` : `${y} 年`
}
const clean = (s: string) => s.replace(/\[(\d+|来源请求|注\s*\d+)\]/g, '').replace(/\s+/g, '').trim()
const ORG = /^(中华人民共和国|中国共产党|中共)/
const norm = (s: string) =>
  s.replace(/^(中共|中国共产党|中华人民共和国|中国人民解放军)/, '').replace(/(党组|党委)(副)?书记、|(党组|党委)成员、|党组|党委/g, '').replace(/^国家/, '')
const same = (a: string, b: string) => {
  const x = norm(a), y = norm(b)
  return x === y || x.includes(y) || y.includes(x)
}
// the same post written two ways: "河南省委副书记，省政府省长、党组书记" vs "河南省委副书记、河南省人民政府省长"
const provOf = (s: string) => PROVS.find((p) => s.replace(/^中共/, '').startsWith(p))
const roleKey = (s: string) =>
  new Set(
    s
      .replace(/^(中共|中国共产党)/, '')
      .split(/[、，,]|兼/)
      .map((seg) => {
        let t = seg.trim()
        const p = PROVS.find((x) => t.startsWith(x))
        if (p) t = t.slice(p.length)
        return t.replace(/^(壮族|回族|维吾尔)?(省|自治区|市)/, '').replace(/^(人民政府|政府)/, '').replace(/^(委|党委)/, '委')
      })
      .filter((t) => t && !/^(党组|党委)(副)?(书记|成员)$|^省政府党组(副)?书记$/.test(t)),
  )
const sameish = (a: string, b: string) => {
  if (same(a, b)) return true
  if (provOf(a) !== provOf(b)) return false
  const x = roleKey(a), y = roleKey(b)
  return x.size > 0 && x.size === y.size && [...x].every((k) => y.has(k))
}

function wdOf(key: string): WD | undefined {
  const qid = PICKS[key] ?? picks[key]?.qid
  if (!qid) return undefined
  const f = join(ROOT, 'research', 'wikidata', `${qid}.json`)
  if (!existsSync(f)) return { qid }
  return { ...(JSON.parse(readFileSync(f, 'utf8')) as WD), qid }
}
const wikiOkFor = (sid?: string) => !!sid && existsSync(join(ROOT, 'sources', 'text', `${sid}.txt`))
function leadOf(name: string, sid?: string): string {
  if (!sid) return ''
  const f = join(ROOT, 'sources', 'text', `${sid}.txt`)
  if (!existsSync(f)) return ''
  const paras = readFileSync(f, 'utf8')
    .replace(/[\u200b-\u200f\u2060\ufeff\u00ad]/g, '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
  return clean(paras.find((s) => s.startsWith(name) && /（\d{4}年/.test(s)) ?? paras.find((s) => s.includes(name + '（') && /（\d{4}年/.test(s)) ?? '')
}
// dated posts from the article's career paragraphs: "2017年4月，任中共浙江省委常委、省纪委书记"
const KEY = /书记|省长|市长|州长|县长|部长|主任|司令员|政治委员|政委|参谋长|董事长|总经理|行长|校长|院长|局长|署长|审计长|司长|特派员|主席|常委|军长|师长|旅长|所长|总设计师|总工程师|厅长|秘书长/
function narrative(sid?: string, name = ''): { title: string; from: string; to?: string }[] {
  if (!sid) return []
  const f = join(ROOT, 'sources', 'text', `${sid}.txt`)
  if (!existsSync(f)) return []
  const res: { title: string; from: string; to?: string }[] = []
  if (Object.values(EXTRA).includes(sid)) {
    const D = String.raw`(\d{4})(?:\.\s?(\d{1,2})|年(?:(\d{1,2})月)?)`
    const re = new RegExp(String.raw`${D}\s*(?:—+|－+|-{1,2}|至)?\s*(?:${D})?\s*([^\n；;。]*?)(?=\s*\d{4}(?:\.\s?\d{1,2}|年)|[\n；;。]|$)`, 'g')
    const ymd = (y?: string, a?: string, b?: string) => (y ? ((a ?? b) ? `${y}-${(a ?? b)!.padStart(2, '0')}` : y) : undefined)
    for (const m of readFileSync(f, 'utf8').matchAll(re)) {
      const title = m[7]
        .replace(/[（(][^）)]*[）)]/g, '')
        .replace(/[（(][^）)]*$/, '')
        .replace(new RegExp(`^[，,\\s]*(?:${name}|他|她)?起?(?:先后)?(?:历任|调任|转任|担任|升任|出任|任)`), '')
        .replace(/，(?:次年|次月|同年|后|并|当选|转任|调任|兼任|任).*$/, '')
        .replace(/[，、]$/, '')
        .trim()
      if (title.length < 4 || /^[\d，,]/.test(title) || /^(挂职|董事|副|党委|党组|兼|其间)|[）)]/.test(title) || !KEY.test(title) || /学习|毕业|研究生|参加工作|加入中国共产党|出生|生，|代表$|选举|补选|决定|当选|消息/.test(title)) continue
      if (!res.some((r) => r.title === title)) res.push({ title, from: ymd(m[1], m[2], m[3])!, to: ymd(m[4], m[5], m[6]) })
    }
    return res
  }
  const who = name ? `(?:${name}|他|她)?` : '(?:他|她)?'
  const re = new RegExp(
    `(\\d{4})年(?:(\\d{1,2})月)?(?:\\d{1,2}日)?(?:起)?(?:至(\\d{4})年(?:(\\d{1,2})月)?)?[，,]?\\s*(?:${name ? name + '|' : ''}他|她)?(?:[^。；，\\d任]{0,24}[，,]?)?${who}(?:先后|又|再)?(?:被)?(?:任命(?:${name || '他'})?为|升任|晋升为|出任|转任|调任|担任|兼任|接任|改任|履新|回任|任(?!命|职|期|内|上))([^。；\\[（(]{3,36}?)(?=[，。；\\[（(]|$)`,
    'g',
  )
  for (const para of readFileSync(f, 'utf8').split(/\n\s*\n/)) {
    const t = para.trim()
    const d = t.match(/^(\d{4})\.(\d{2})—(?:(\d{4})\.(\d{2}))?\s+(.+)$/)
    if (d) {
      const title = d[5].replace(/（.*?）/g, '').trim()
      if (KEY.test(title) && !/学习|毕业/.test(title)) res.push({ title, from: `${d[1]}-${d[2]}`, to: d[3] ? `${d[3]}-${d[4]}` : undefined })
      continue
    }
    if (t.startsWith('^') || t.includes('取自') || t.length < 12) continue
    for (const m of clean(t).matchAll(re)) {
      if (/不再|免去|辞去|卸任|离任|退出|拟任|提名/.test(m[0].slice(0, m[0].length - m[5].length))) continue
      let title = m[5].replace(/^(中共|中国共产党)/, '').replace(/(等职务|等职)$/, '').replace(/职务$/, '').trim()
      if (/代表|委员会委员|候补委员|院士|军衔|将$|政协委员|毕业|学习|的|期间|其间|以来|至今|一职|职位|时任|视察|担任|出任|任职|回到|披露|并/.test(title) || !KEY.test(title)) continue
      if (/^[^\u4e00-\u9fa5]|^(职|命|副|常务|党组|党委|政治部|办公厅|院长|司长|局长|主任|书记|部长|该|市委|市政府|署|研究室|总工程师|化学系|理学院|研究生院|战略策划部|政策法规司|新闻司|礼宾司|住房改革)/.test(title)) continue
      if (/[，,](?:任|调任|出任)|候选人/.test(title)) continue
      title = title.replace(/^新任/, '').replace(/[）)]$/, '').replace(/\d{4}年.*$/, '')
      const from = m[2] ? `${m[1]}-${m[2].padStart(2, '0')}` : m[1]
      const to = m[3] ? (m[4] ? `${m[3]}-${m[4].padStart(2, '0')}` : m[3]) : undefined
      if (!res.some((r) => r.title === title)) res.push({ title, from, to })
    }
  }
  return res
}
function birthplaceOf(lead: string, wd?: WD): string | undefined {
  const head = lead.split('。').slice(0, 2).join('。')
  for (const m of head.matchAll(/[，。）]([\u4e00-\u9fa5]{2,12}?)人(?=[，。（]|$)/g)) {
    let s = m[1]
    if (/政治|人物|军|家|员|党|族|官|男|女|生于|籍贯|中华|不详/.test(s)) continue
    s = s.replace(/^出生于/, '').replace(/省(?=.)/, '').replace(/市(?=.)/g, '').replace(/市$/, '').replace(/^(.{2,3})省$/, '$1')
    if (s.length >= 2) {
      const pr = PROVS.some((p) => s.startsWith(p)) ? undefined : Object.entries(BPPROV).find(([k]) => s.startsWith(k))?.[1]
      return pr ? pr + s : s
    }
  }
  const g = head.match(/籍贯([\u4e00-\u9fa5]{2,8}?)[，。]/)
  if (g && !/不详/.test(g[1])) return g[1]
  if (wd?.birthplace && !/不详|中华人民共和国|^中国$/.test(wd.birthplace)) {
    let s = wd.birthplace.replace(/^(.{2,3}?)省$/, '$1').replace(/^(.{2,}?)市$/, '$1')
    if (!PROVS.some((p) => s.startsWith(p))) {
      const pr = Object.entries(BPPROV).find(([k]) => s.startsWith(k))?.[1]
      if (pr) s = pr + s
    }
    return s
  }
  return undefined
}
function earlier(lead: string): string | undefined {
  const m = lead.match(/(?:曾任|历任|曾先后任|曾先后担任)([^。；]+)/)
  if (!m) return undefined
  let s = m[1]
    .split(/[，,]现任|；现任|[，,]是/)[0]
    .replace(/(等职务|等职)$/, '')
    .replace(/[，,]任/g, '，')
    .replace(/（[^）]*$|^[^（]*）/g, '')
    .replace(/）/g, (x, i, all: string) => (all.slice(0, i).includes('（') ? x : ''))
  if (s.length > 70) {
    const cut = s.lastIndexOf('，', 70)
    s = s.slice(0, cut > 20 ? cut : 70)
  }
  return s.replace(/[，、]$/, '')
}

const out: string[] = ['# K06 dossier cards (tier 2): people first on the 20th Central Committee lists, full or alternate', '# generated by research/scripts/K06-cards.ts; hand-written parts live in research/scripts/K06-overrides.ts', '']
const roster: string[] = ['# K06: people first on the 20th Central Committee lists', '']
const q = (s: string) => (/[:#[\]{},&*!|>'"%@`]|^[-?\s]|\s$|^\d/.test(s) ? JSON.stringify(s) : s)

for (const p of data) {
  const ov = OV[p.id] ?? {}
  const wd = wdOf(p.key)
  const wikiSid = wikiIds[p.key]
  const listSid = p.list === 'cc' ? 'k06-wiki-20th-cc-list' : 'k06-wiki-20th-cca-list'
  const resumeLead = EXTRA[p.id] ? clean(read('sources', 'text', `${EXTRA[p.id]}.txt`).split(/\n\s*\n/).find((s) => s.trim().startsWith(p.name + '，')) ?? '') : ''
  const lead = leadOf(p.name, wikiSid) || resumeLead
  const general = /将/.test(p.rank ?? '')
  const promoted = PROMOTED[p.name]

  // positions: the table first (posts since 2022), then earlier Wikidata posts
  const tab = p.lines.map(parseLine).filter((x): x is NonNullable<typeof x> => !!x)
  const notes = p.lines.filter((l) => /院士/.test(l) && !/—/.test(l)).map((l) => l.replace(/\[注\s*\d+\]/g, '').split('，')[0])
  let pos: Pos[] = tab.map((t) => ({ title: t.title, sys: sysOf(t.title, general), place: placeOf(t.title, general), from: t.from, to: t.to, cite: listSid }))
  const extraSid = EXTRA[p.id]
  const nar0 = narrative(wikiOkFor(wikiSid) ? wikiSid : undefined, p.name)
  const ex0 = extraSid ? narrative(extraSid, p.name) : []
  for (const x of pos) {
    if (x.from || x.cite !== listSid) continue
    const hit = [...ex0, ...nar0].filter((y) => sameish(y.title, x.title) && (!x.to || y.from < x.to)).sort((a, b) => a.from.localeCompare(b.from))[0]
    if (hit) x.from = hit.from
  }
  const firstFrom = pos.map((x) => x.from ?? x.to).filter(Boolean).sort()[0] ?? '9999'
  const wdCands = (wd?.positions ?? [])
    .filter((x) => x.from && /^[\u4e00-\u9fa5]/.test(x.label) && !/代表|中央委员会|委员会委员|候补委员|政协委员|院士/.test(x.label))
    .map((x) => ({ title: x.label.replace(ORG, ''), from: x.from!.slice(0, 7), to: x.to?.slice(0, 7), cite: `wd-${wd!.qid}` }))
  const cands = [
    ...ex0.map((x) => ({ ...x, cite: extraSid! })),
    ...nar0.map((x) => ({ ...x, cite: wikiSid })),
    ...wdCands,
  ].sort((a, b) => a.from.localeCompare(b.from))
  // carry the province into bare "省委常委…" titles from the previous post
  let lastPlace: string | undefined
  for (const c of cands) {
    const pl = placeOf(c.title, general)
    if (pl) lastPlace = pl
    else if (lastPlace && /^(省委|省政府|省人民政府|自治区党委|自治区政府)/.test(c.title)) c.title = lastPlace + c.title
  }
  const early: Pos[] = []
  for (const c of cands) {
    const t = c.title
    if (c.from.slice(0, 7) >= firstFrom || /届|^署/.test(t)) continue
    if (pos.some((y) => sameish(y.title, t))) continue
    if (early.some((y) => norm(y.title) === norm(t) || (y.from === c.from && same(y.title, t)))) continue
    early.push({ title: t, sys: sysOf(t, general), place: placeOf(t, general), from: c.from, to: c.to, cite: c.cite })
  }
  early.sort((a, b) => a.from!.localeCompare(b.from!))
  // drop short-lived steps (acting posts, a few weeks as deputy secretary before the governorship)
  const all = [...early, ...pos].sort((a, b) => (a.from ?? a.to ?? '9999').localeCompare(b.from ?? b.to ?? '9999'))
  const months = (a?: string, b?: string) => (a && b ? (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + (Number(b.slice(5, 7) || 1) - Number(a.slice(5, 7) || 1)) : 99)
  const kept = all.filter((x, i) => {
    if (x.cite === listSid) return true
    if (x.from && x.to && months(x.from, x.to) < 6) return false
    const next = all[i + 1]
    return !(next && x.from && next.from && months(x.from, next.from) < 6 && (x.place ?? '') === (next.place ?? ''))
  })
  pos = kept
  pos.sort((a, b) => (a.from ?? a.to ?? '9999').localeCompare(b.from ?? b.to ?? '9999'))
  if (ov.positions) pos = ov.positions
  pos = pos.slice(-6)

  // roles
  const roles = new Set<string>(promoted ? ['acc', 'cc'] : [p.list === 'cc' ? 'cc' : 'acc'])
  const titles = pos.map((x) => x.title).concat(tab.map((t) => t.title))
  const provChief = (t: string) =>
    t.split(/[、，]/).some((s) =>
      PROVS.some((pr) => s.startsWith(pr) && (/^[^、]*?(省委|自治区党委|^(北京|天津|上海|重庆)市委)书记$/.test(s) || /人民政府(代理)?(省长|主席|市长)$/.test(s))),
    )
  if (titles.some(provChief)) roles.add('prov')
  const minister = (t: string) =>
    t.split('，').some((s) => (!general || /国防部部长/.test(s)) && !/^(中央|中共)/.test(s) && !/副(部长|主任|局长|署长|主席|审计长)$/.test(s) && /^[^、]*(部|委员会|总署|审计署|总局|证监会)(党组|党委)?(书记、)?(部长|主任|署长|审计长|局长|主席)$/.test(s))
  if (p.level !== '副部' && p.level !== '正厅' && titles.some(minister)) roles.add('minister')
  if (general) roles.add('general')
  for (const r of ov.roles ?? []) roles.add(r)
  const status = ov.status ?? 'active'
  if (status === 'purged' || status === 'detained') roles.add('tiger')
  const order = ['cc', 'acc', 'prov', 'minister', 'general', 'tiger']
  const roleList = order.filter((r) => roles.has(r))

  // headline
  const cur = [...tab].reverse().find((t) => !t.to)
  const last = tab.at(-1)
  let headline = ov.headline
  if (!headline) {
    headline = cur ? cur.title : last ? `原${last.title}` : '二十届中央' + (p.list === 'cc' ? '委员' : '候补委员')
    if (general) headline += `，${p.rank}`
    else if (notes[0] && !headline.includes('院士')) headline += `，${notes[0]}`
  }

  // bio
  const birthplace = ov.birthplace ?? birthplaceOf(lead, wd)
  let bio = ov.bio
  if (!bio) {
    const memb = p.list === 'cc' ? '二十届中央委员' : promoted ? `二十届中央候补委员，${promoted.when}${promoted.plenum}递补为中央委员` : '二十届中央候补委员'
    let pre = earlier(lead)
      ?.split('，')
      .filter((s) => !tab.some((t) => sameish(t.title, s) || s.split('、').some((u) => u.length > 3 && same(t.title, u))))
      .join('，')
    if (!pre) {
      const prior = pos.filter((x) => x.cite !== listSid && !tab.some((t) => same(t.title, x.title))).slice(-3).map((x) => x.title)
      pre = prior.length ? prior.join('，') : undefined
    }
    const a = `${birthplace ? birthplace + '人，' : ''}${memb}${pre ? `；曾任${pre}等职` : ''}。`
    const span = (t: { title: string; from?: string; to?: string }) =>
      t.from && t.to ? `${fmt(t.from)}至 ${fmt(t.to)}任${t.title}` : t.from ? `${fmt(t.from)}起任${t.title}` : t.to ? `至 ${fmt(t.to)}任${t.title}` : `现任${t.title}`
    const recent = tab.slice(-3).map(span)
    const b = recent.length ? recent.join('，') + '。' : ''
    bio = (a + b + (ov.bioTail ?? '')).replace(/。。/g, '。')
  }

  const born = ov.born ?? p.born ?? wd?.born?.slice(0, 7)
  if (wd?.born && p.born && wd.born.slice(0, 4) !== p.born.slice(0, 4)) report.push(`BORN CONFLICT ${p.name} ${p.id}: table ${p.born}, Wikidata ${wd.born}`)
  if (!born) report.push(`NO BIRTH DATE ${p.name} ${p.id}`)
  if (!birthplace) report.push(`NO BIRTHPLACE ${p.name} ${p.id}`)
  if (!wd?.qid) report.push(`NO WIKIDATA ${p.name} ${p.id}`)
  if (pos.length < 3) report.push(`FEW POSITIONS (${pos.length}) ${p.name} ${p.id}`)

  const wdOk = wd?.qid && existsSync(join(ROOT, 'research', 'wikidata', `${wd.qid}.json`))
  const wikiOk = wikiSid && existsSync(join(ROOT, 'sources', 'text', `${wikiSid}.txt`))
  if (wikiSid && !wikiOk) report.push(`WIKI TEXT MISSING ${p.name} ${wikiSid} (not cited)`)
  const cites = [
    ...(wdOk ? [`wd-${wd!.qid}`] : []),
    ...(wikiOk ? [wikiSid] : []),
    listSid,
    p.list === 'cc' ? 'k02-xinhua-2022-10-22-20-cc' : 'k02-xinhua-2022-10-22-20-cca',
    ...(promoted ? [promoted.cite] : []),
    ...(ov.cites ?? []),
    ...(ov.fall ?? []).map((f) => f.cite),
    ...pos.map((x) => x.cite).filter((c) => c && !c.startsWith('wd-') && !c.includes('-wiki-')),
  ]
  const uniq = [...new Set(cites)]

  const L: string[] = []
  L.push(`- id: ${p.id}`, `  name: ${p.name}`)
  if (p.gender) L.push(`  gender: ${p.gender}`)
  if (p.ethnicity) L.push(`  ethnicity: ${p.ethnicity}`)
  if (born) L.push(`  born: ${born}`)
  if (ov.died) L.push(`  died: ${ov.died}`)
  if (birthplace) L.push(`  birthplace: ${q(birthplace)}`)
  L.push(`  roles: [${roleList.join(', ')}]`, `  status: ${status}`)
  if (ov.statusNote) L.push(`  statusNote: ${q(ov.statusNote)}`)
  if (ov.fall?.length) {
    L.push('  fall:')
    for (const f of ov.fall) L.push(`    - { date: ${f.date}, text: ${q(f.text)}, cite: ${f.cite} }`)
  }
  L.push('  tier: 2', `  headline: ${q(headline)}`)
  if (wdOk) L.push(`  ids: { wikidata: ${wd!.qid} }`)
  L.push('  bio: >-', `    ${bio}`)
  if (pos.length) {
    L.push('  positions:')
    for (const x of pos) {
      const f = [`title: ${q(x.title)}`, `sys: ${x.sys}`, x.place && `place: ${x.place}`, x.from && `from: ${x.from}`, x.to && `to: ${x.to}`, `cite: ${x.cite}`].filter(Boolean)
      L.push(`    - { ${f.join(', ')} }`)
    }
  }
  L.push(`  cites: [${uniq.join(', ')}]`, '')
  out.push(...L)
  roster.push(`- { id: ${p.id}, name: ${p.name}, batch: K06, tier: 2 }`)
}

writeFileSync(join(ROOT, 'content', 'people', 'K06.yaml'), out.join('\n'), 'utf8')
writeFileSync(join(ROOT, 'research', 'roster', 'K06.yaml'), roster.join('\n') + '\n', 'utf8')
writeFileSync(join(ROOT, '.probe', 'K06-cards.txt'), report.join('\n') + '\n', 'utf8')
console.log(`${data.length} cards; ${report.length} report lines`)

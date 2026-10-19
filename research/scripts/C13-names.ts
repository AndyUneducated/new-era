// C13: names that the case studies (content/cases/*.yaml) mention but that have no card in content/people/
// (nor a roster entry), with where they appear and a snippet. Same extraction as R09-names.ts, cases only.
//   node research/scripts/C13-names.ts   -> .probe/C13-names.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const yamls = (dir: string) => readdirSync(dir).filter((f) => f.endsWith('.yaml') && !f.startsWith('00-'))
const load = (p: string) => parse(readFileSync(p, 'utf8')) ?? []

const known = new Set<string>()
for (const f of yamls('content/people'))
  for (const p of load(`content/people/${f}`) as { name: string; aka?: string[] }[]) {
    known.add(p.name)
    for (const a of p.aka ?? []) known.add(a)
  }
const rostered = new Map<string, string>()
for (const f of yamls('research/roster'))
  for (const r of load(`research/roster/${f}`) as { name: string; batch: string }[]) rostered.set(r.name, r.batch)
for (const r of load('research/roster.yaml') as { name: string; batch: string }[]) rostered.set(r.name, r.batch ?? 'roster')

const SUR =
  '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤常温康施文牛樊葛邢安齐易乔伍庞颜倪庄聂章鲁岳翟殷詹申欧耿关兰焦俞左柳甘祝包宁尚符舒阮柯纪梅童凌毕单季裴霍涂成苗谷盛曲翁冉骆蓝路游辛靳管柴蒙鲍华喻祁蒲房滕屈饶解牟艾尤阳时穆农司卓古吉缪简车项连芦麦褚娄窦戚岑景党宫费卜冷晏席卫米柏宗瞿桂全佟应臧闵苟邬边卞姬师和仇栾隋商刁沙荣巫寇桑郎甄丛仲虞敖巩明佘池查麻苑迟邝楼斯'
const TITLE =
  '(?:省委书记|市委书记|县委书记|区委书记|州委书记|书记|副市长|市长|副省长|副局长|局长|副厅长|厅长|副主任|主任|秘书长|秘书|董事长|总经理|总裁|行长|副院长|院长|检察长|部长|处长|县长|区长|州长|主席|老板|商人|司长|组长|常委|巡视员|总监|会长|台长|校长|政委|司令员|妻子|之妻|之子|弟弟|哥哥|女儿|儿子|情妇|前妻|老板娘|董事|副政委|副司令员|参谋长|副部长|委员|理事长|理事|姐夫|姐姐|之父|父亲|母亲|丈夫|教授|局长助理|厅长助理)'
const STOP = '[、，。；：（）()“”"\\s和与及等被因在是的曾任于也则向为称说又将已从对把给后均]'
const re = new RegExp(`${TITLE}([${SUR}][\\u4e00-\\u9fff]{1,2}?)(?=${STOP})`, 'g')
const reList = new RegExp(`(?<=[、])([${SUR}][\\u4e00-\\u9fff]{1,2}?)(?=[、，等和])`, 'g')

type Hit = { where: string; snip: string; via: string }
const hits = new Map<string, Hit[]>()
const add = (name: string, h: Hit) => {
  if (known.has(name)) return
  if (!hits.has(name)) hits.set(name, [])
  hits.get(name)!.push(h)
}
const walk = (v: unknown, where: string, out: (s: string, w: string) => void) => {
  if (typeof v === 'string') out(v, where)
  else if (Array.isArray(v)) v.forEach((x) => walk(x, where, out))
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'cite' && k !== 'cites') walk(x, where, out)
}
// looser: a surname and one or two characters right before a year, a verb of investigation or a bracket
const reLoose = new RegExp(`(?<=[，。、；：“（\\s原和与])([${SUR}][\\u4e00-\\u9fff]{1,2}?)(?=\\d{4}年|被|曾|于\\d|（|说|称|任[^务何])`, 'g')
// three-character tokens between punctuation and a name-ending context, minus tokens with common non-name characters
const reThree = new RegExp(`(?<=[，。、；：“（\\s])([${SUR}][\\u4e00-\\u9fff]{2})(?=[，。、；：”）\\s以被曾和与等的在说称任向对])`, 'g')
const NONAME = /[的是在年月日了和与及等为对把被从向说称任上下中大小不也都有个这那其省市县区部委局厅院所会党军国家人员事件案罪万亿元次名第]/
const scan = (s: string, where: string) => {
  for (const m of s.matchAll(reThree))
    if (!NONAME.test(m[1].slice(1))) add(m[1], { where, snip: s.slice(Math.max(0, m.index! - 30), m.index! + m[0].length + 30), via: '3' })
  for (const m of s.matchAll(re)) add(m[1], { where, snip: s.slice(Math.max(0, m.index! - 30), m.index! + m[0].length + 30), via: 't' })
  for (const m of s.matchAll(reList)) add(m[1], { where, snip: s.slice(Math.max(0, m.index! - 30), m.index! + m[0].length + 30), via: 'l' })
  for (const m of s.matchAll(reLoose)) add(m[1], { where, snip: s.slice(Math.max(0, m.index! - 30), m.index! + m[0].length + 30), via: 'x' })
}

for (const f of yamls('content/cases')) {
  const d = load(`content/cases/${f}`)
  for (const item of d as { id: string }[]) walk(item, `${f}:${item.id ?? '?'}`, scan)
}

const rows = [...hits.entries()].filter(([n]) => !rostered.has(n) && !(n.length === 3 && known.has(n.slice(0, 2)))).sort((a, b) => b[1].length - a[1].length)
const out: string[] = [`# ${rows.length} names (skipped rostered: ${[...hits.keys()].filter((n) => rostered.has(n)).join(' ')})`]
for (const [n, hs] of rows) {
  out.push(`## ${n}  ${hs.length}  ${[...new Set(hs.map((h) => h.via))].join('')}`)
  for (const h of hs.slice(0, 3)) out.push(`  ${h.where}: ${h.snip.replace(/\s+/g, ' ')}`)
}
writeFileSync('.probe/C13-names.txt', out.join('\n') + '\n', 'utf8')
console.log(rows.length)

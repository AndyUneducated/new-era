// R09: officials named with a post in the stored source texts that the case studies and case records cite
// (verdicts, notices, investigations), who have no card, roster entry or C12 place.
//   node research/scripts/R09-srcnames.ts   -> .probe/R09-srcnames.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const yamls = (dir: string) => readdirSync(dir).filter((f) => f.endsWith('.yaml') && !f.startsWith('00-'))
const load = (p: string) => parse(readFileSync(p, 'utf8')) ?? []
const known = new Set<string>()
for (const f of yamls('content/people'))
  for (const p of load(`content/people/${f}`) as { name: string; aka?: string[] }[]) {
    known.add(p.name)
    for (const a of p.aka ?? []) known.add(a)
  }
const rostered = new Set<string>()
for (const f of yamls('research/roster')) for (const r of load(`research/roster/${f}`) as { name: string }[]) rostered.add(r.name)
for (const r of load('research/roster.yaml') as { name: string }[]) rostered.add(r.name)
const C12 = `曹均章 彭京堂 王洪斌 苏海辉 陈德民 李军 夏志和 陈炽 李士生 殷志红 张立克 刘宏建 杨建华 李仲彬 高先海 王雁飞 古正举 孟庆丰 刘军 许骏 李超 姜洋 黄炜 陈文辉 王东明 刘鸿儒 于丽芳 苏铁志 周建华 姚敏建 宁延令 李安泽 陈卫民 魏鹏远 于铁义 张中生 姜人杰 许迈永 楼忠福 崔晓玉 魏新 范增玉 郑朋 刘琳 于振永 何宏达 林强 石晓春 李全 邵力平 李茂荣 王合清 刘海昌 倪会忠 秦方进 鲁进武`.split(' ')
for (const n of C12) rostered.add(n)

const cited = new Map<string, Set<string>>()
const take = (v: unknown, owner: string) => {
  if (Array.isArray(v)) v.forEach((x) => take(x, owner))
  else if (v && typeof v === 'object')
    for (const [k, x] of Object.entries(v)) {
      if ((k === 'cite' || k === 'cites') && x) for (const c of [x].flat() as string[]) {
        const id = c.split('@')[0]
        if (!cited.has(id)) cited.set(id, new Set())
        cited.get(id)!.add(owner)
      } else take(x, owner)
    }
}
for (const f of yamls('content/cases')) for (const c of load(`content/cases/${f}`) as { id: string }[]) take(c, `case:${c.id}`)
for (const dir of ['content/factions', 'content/faction-voices']) for (const f of yamls(dir)) {
  const d = load(`${dir}/${f}`)
  if (Array.isArray(d)) for (const x of d) take(x, `faction:${x.id}`)
  else for (const [k, x] of Object.entries(d)) take(x, `faction:${k}`)
}
for (const f of yamls('content/falls')) for (const [k, x] of Object.entries(load(`content/falls/${f}`))) take(x, `fall:${k}`)

const SUR =
  '王李张刘陈杨黄赵吴周徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董袁潘于蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤常温康施文牛樊葛邢安齐易乔伍庞颜倪庄聂章鲁岳翟殷詹申欧耿关兰焦俞左柳甘祝包宁尚符舒阮柯纪梅童凌毕单季裴霍涂成苗谷盛曲翁冉骆蓝路游辛靳管柴蒙鲍华喻祁蒲房滕屈饶解牟艾尤阳时穆农司卓古吉缪简车项连芦麦褚娄窦戚岑景党宫费卜冷晏席卫米柏宗瞿桂全佟应臧闵苟邬边卞姬师和仇栾隋商刁沙荣巫寇桑郎甄丛仲虞敖巩明佘池查麻苑迟邝'
const TITLE =
  '(?:市委书记|县委书记|区委书记|州委书记|地委书记|副市长|市长|副局长|公安局长|局长|副厅长|厅长|副主任|主任|秘书长|秘书|董事长|总经理|行长|检察长|院长|副部长|部长|县长|区长|州长|专员|司长|巡视员|副总经理|常务副)'
const STOP = '[、，。；：（）()“”"\\s和与及等被因在是的曾任于也则向为称说又将已从对把给后均同共收送利谋提安先接担]'
const re = new RegExp(`${TITLE}([${SUR}][\\u4e00-\\u9fff]{1,2}?)(?=${STOP})`, 'g')

const hits = new Map<string, { owners: Set<string>; snips: string[] }>()
for (const [id, owners] of cited) {
  const p = `sources/text/${id}.txt`
  if (!existsSync(p)) continue
  const s = readFileSync(p, 'utf8')
  for (const m of s.matchAll(re)) {
    const n = m[1]
    if (known.has(n) || rostered.has(n)) continue
    if (!hits.has(n)) hits.set(n, { owners: new Set(), snips: [] })
    const h = hits.get(n)!
    for (const o of owners) h.owners.add(o)
    if (h.snips.length < 3) h.snips.push(`${id}: ${s.slice(Math.max(0, m.index! - 40), m.index! + m[0].length + 30).replace(/\s+/g, ' ')}`)
  }
}
const rows = [...hits.entries()].sort((a, b) => b[1].owners.size - a[1].owners.size)
const out = [`# ${rows.length}`]
for (const [n, h] of rows) {
  out.push(`## ${n}  [${[...h.owners].slice(0, 6).join(' ')}]`)
  for (const s of h.snips) out.push(`  ${s}`)
}
writeFileSync('.probe/R09-srcnames.txt', out.join('\n') + '\n', 'utf8')
console.log(rows.length)

// Builds the R06 name list (CCDI first notices 2024-01 to now) and matches names to people already on file.
// Output: .probe/R06-master.txt (for checking) and .probe/R06-master.json (for R06-falls-list.ts).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

// date, name; the post comes from the CCDI title
const LIST = `
2026-10-18 黄日波|2026-10-13 黄奇帆|2026-10-08 张硕辅|2026-09-28 鲁昕|2026-09-21 覃伟中|2026-09-17 戴玉林|2026-09-05 陈勇|
2026-08-31 刘建洋|2026-08-27 叶建春|2026-08-14 程晓波|2026-08-08 宋致远|2026-07-31 辛保安|2026-07-31 国文清|2026-07-24 方星海|
2026-07-19 欧阳卫民|2026-07-15 蔡赴朝|2026-07-10 李建波|2026-07-06 梁潮平|2026-07-03 张灼华|2026-06-27 贺志亮|2026-06-24 卞志刚|
2026-06-20 朱昌杰|2026-06-16 姜宏伟|2026-06-13 俞小平|2026-06-10 陈宇剑|2026-06-06 魏小东|2026-06-02 黎晓宏|2026-05-30 王益华|
2026-05-27 李伟|2026-05-23 徐留平|2026-05-17 王晓东|2026-05-06 费高云|2026-04 伍浩|2026-04-17 罗蔺|2026-04-12 丁业现|
2026-04-09 姚玉舟|2026-04-07 王文灵|2026-04-03 马兴瑞|2026-03-30 岳普煜|2026-03-27 郭永航|2026-03-24 周亮|2026-03-20 胡衡华|
2026-03-17 雷思维|2026-02-28 韩嵩|2026-02-10 易炼红|2026-02-07 徐一丁|2026-02-05 肖杰|2026-02-03 连辑|2026-01-31 王祥喜|
2026-01-29 孙绍骋|2026-01-27 包惠|2026-01-24 杨宏勇|2026-01-22 张建龙|2026-01-19 顾军|2026-01-08 李旭|2026-01-05 田学斌|
2025-12-30 张世平|2025-12-27 郭学益|2025-12-24 王峻|2025-12-21 尹建业|2025-12-18 王文华|2025-12-15 戴北方|2025-12-12 潘良|
2025-12-06 于泽|2025-12-03 叶红专|2025-11-30 陈伟俊|2025-11-26 王凤朝|2025-11-20 毕宝文|2025-11-16 李百安|2025-11-07 方红卫|
2025-11-01 金之镇|2025-10-28 侯维栋|2025-10-25 江敦涛|2025-10-17 张尧学|2025-10-14 许传智|2025-10-12 韩占武|2025-10-09 乌兰|
2025-09-20 姜德果|2025-09-17 任羽中|2025-09-09 林景臻|2025-09-06 易会满|2025-08-29 唐德智|2025-08-22 王莉霞|2025-08-18 高兴夫|
2025-07-24 吴胜华|2025-07-18 刘慧|2025-07-14 韩松|2025-07-08 周先旺|2025-07-04 冯志斌|2025-06-28 刘绍勇|2025-06-25 倪强|
2025-06-22 于文明|2025-06-19 胡幼桃|2025-06-16 彭晓春|2025-06-12 费东斌|2025-06-09 高以忱|2025-05-29 毕井泉|2025-05-28 张建华|
2025-05-25 刘宽忍|2025-05-21 叶寒冰|2025-05-16 蓝天立|2025-05-13 李春良|2025-05-09 陆文俊|2025-04-30 王建军|2025-04-25 宋朝华|
2025-04-17 杨小伟|2025-04-12 金湘军|2025-04-03 龙翔|2025-03-31 段成刚|2025-03-27 徐宪平|2025-03-21 王会民|2025-03-18 李文荣|
2025-03-13 周德睿|2025-03-01 袁光宇|2025-02-26 陈时飞|2025-02-21 蒋超良|2025-02-16 王中和|2025-02-12 刘卫东|2025-02-06 周喜安|
2025-01-23 齐扎拉|2025-01-17 张天峰|
2024-12-28 周家斌|2024-12-21 寇伟|2024-12-16 吴存荣|2024-12-11 马丰胜|2024-12-06 罗增斌|2024-11-27 朱芝松|2024-11-08 章更生|
2024-11-04 陆克华|2024-10-25 赵金云|2024-10-21 张效廉|2024-10-17 刘满仓|2024-10-14 杨发森|2024-10-10 陈笑波|2024-10-08 齐同生|
2024-09-30 李刚|2024-09-28 曹兴信|2024-09-24 孙玉宁|2024-09-18 杜玉波|2024-08-30 谭瑞松|2024-08-27 崔保华|2024-07-29 李微微|
2024-07-25 罗保铭|2024-06-25 李石松|2024-06-21 张建春|2024-06-19 洪礼和|2024-06-16 吴英杰|2024-06-12 杨子兴|2024-06-09 徐佐|
2024-06-03 王波|2024-05-30 苟仲文|2024-05-25 徐𬎆|2024-05-22 刘星泰|2024-05-20 王昊|2024-05-18 唐仁健|2024-05-16 楼文龙|
2024-04-30 刘志强|2024-04-21 高朋|2024-04-16 秦如培|2024-04-15 杜梓|2024-04-07 何文忠|2024-04-03 张平|2024-04-02 唐一军|
2024-03-25 陈晏|2024-03-23 李钺锋|2024-03-20 窦万贵|2024-03-18 刘跃进|2024-03-17 李显刚|2024-03-15 李勇|2024-03-13 李吉平|
2024-03-01 张祖林|2024-02-21 胡强|2024-02-05 龙飞|2024-02-02 王宜林|2024-01-29 王勇|2024-01-26 戴道晋|2024-01-21 苏增添|
2024-01-10 彭国甫|2024-01-02 钟自然`

const titles: { title: string; url?: string }[] = []
for (const l of readFileSync('.probe/R06-zjsc.txt', 'utf8').split('\n')) {
  const [, t, u] = l.split('\t')
  if (t && !t.includes('开除')) titles.push({ title: t.replace(/^\u200b/, ''), url: u })
}
for (const f of ['.probe/R06-hebei1.txt', '.probe/R06-hebei2.txt'])
  for (const l of readFileSync(f, 'utf8').split('\n')) if (l.startsWith('## ') && l.includes('接受')) titles.push({ title: l.slice(3).trim() })
for (const l of readFileSync('.probe/R06-wiki-list.txt', 'utf8').split('\n')) {
  const m = l.match(/^\| ([^|]+) \| ([^|]+) \| (20\d\d)年/)
  if (m) titles.push({ title: `${m[2].trim()}${m[1].replace(/\s/g, '')}接受（维基）` })
}

type P = { id: string; name: string; roles?: string[]; fall?: unknown[]; status: string; positions?: { title: string }[] }
const people: (P & { file: string })[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) people.push({ ...p, file: f })
const roster: { id: string; name: string; batch: string }[] = []
for (const f of readdirSync('research/roster').filter((f) => f.endsWith('.yaml')))
  roster.push(...((parse(readFileSync(`research/roster/${f}`, 'utf8')) ?? []) as typeof roster))
roster.push(...((parse(readFileSync('research/roster.yaml', 'utf8')) ?? []) as typeof roster))

const out: string[] = []
const json: unknown[] = []
for (const item of LIST.replace(/\n/g, '').split('|')) {
  const [date, name] = item.trim().split(' ')
  const t = titles.find((x) => x.title.includes(`${name}接受`) && x.url) ?? titles.find((x) => x.title.includes(`${name}接受`))
  const post = t ? t.title.slice(0, t.title.indexOf(`${name}接受`)) : '?'
  const cands = people.filter((p) => p.name === name)
  const ros = roster.filter((r) => r.name === name && !cands.some((c) => c.id === r.id))
  const c = cands.map((p) => `${p.id}@${p.file}[${p.status};${(p.roles ?? []).join(',')};fall=${(p.fall ?? []).length};${p.positions?.at(-1)?.title ?? ''}]`)
  out.push(`${date}\t${name}\t${post}\t${t?.url ?? ''}\t${c.join(' | ')}${ros.length ? ` ROSTER:${ros.map((r) => `${r.id}/${r.batch}`).join(',')}` : ''}`)
  json.push({ date, name, post, url: t?.url, cands: cands.map((p) => ({ id: p.id, file: p.file, status: p.status, roles: p.roles, fall: (p.fall ?? []).length })), roster: ros })
}
writeFileSync('.probe/R06-master.txt', out.join('\n'), 'utf8')
writeFileSync('.probe/R06-master.json', JSON.stringify(json, null, 1), 'utf8')
console.log(out.length)

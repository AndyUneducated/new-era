// CS10 one-off: the numbers quoted in insiders-law-enforcement and central-inspection.
// Run: node research/scripts/CS10-stats.ts   Writes research/scripts/CS10-stats.txt
import { writeFileSync } from 'node:fs'
import { parseFall } from '../../src/lib/caseparse.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const out: string[] = []
const byId = new Map(d.people.map((p) => [p.id, p]))
const text = (x: string) => d.texts.get(x.split('@')[0])

// 曾在纪委、派驻纪检组、监委、巡视机构任领导职务的落马者（按人物卡职务表筛出，剔除“巡视员”“副巡视员”职级头衔）
const DISCIPLINE = [
  'li-chongxi', 'jin-daoming', 'yang-senlin', 'xie-kemin', 'xiao-bin', 'feng-lixiang', 'zhu-mingguo', 'zhong-shijian',
  'liu-hongjian-nanchong', 'kong-lingzhong', 'he-jiatie', 'li-jianbo', 'zhang-huawei', 'qu-shuhui', 'mo-jiancheng',
  'liu-shengjie', 'qiu-daming', 'yang-xihuai', 'hu-huaibang', 'jiang-guowen', 'liu-jinming', 'dong-hong', 'pan-jiahua',
  'liu-yanping', 'shen-deyong', 'hao-hongjun', 'zhou-qingyu', 'xu-wenrong', 'wang-xuefeng-hebei', 'shang-liguang',
  'liu-lixian', 'li-chao-hunan', 'chen-yuxiang', 'long-fei', 'tang-yijun', 'zhang-ping-gz', 'xu-xiang-citic',
  'liu-feng-cba', 'li-gang-zzb', 'chen-xiaobo', 'zhang-xiaoli', 'wang-huimin', 'tang-yong-pla', 'long-xiang',
  'wang-zhibin', 'xu-chuanzhi', 'wang-renhua', 'wang-jun-xz', 'yang-hongyong', 'wang-donghai', 'yin-hongxing',
  'li-xiaohong-xunshi', 'jiang-hongwei', 'liang-chaoping', 'zhang-shuofu', 'li-yuefeng',
]
// 中央巡视机构的人：巡视组长、副组长、巡视专员、巡视办主任
const INSPECTORS = ['he-jiatie', 'zhang-huawei', 'dong-hong', 'liu-yanping', 'xu-chuanzhi', 'li-xiaohong-xunshi', 'liu-lixian']
// 2021-02-27 至 2022-01-16 两批教育整顿期间被查的政法系统副部级以上
const RECT_FROM = '2021-02-27'
const RECT_TO = '2022-01-16'

const VICE = new Set(['state', 'minister', 'vice', 'general', 'lieutenant', 'exec'])
const tally = (xs: string[]) => {
  const m = new Map<string, number>()
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1)
  return [...m].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' ')
}
const info = (id: string) => {
  const p = byId.get(id)
  if (!p) return undefined
  const rec = d.falls.get(id)
  const c = parseFall(p.fall, p.status, rec, text, p.name)
  return { p, rec, c, first: p.fall[0]?.date ?? '' }
}
const outcome = (c: ReturnType<typeof parseFall>) =>
  c.outcome === 'sentenced' ? (c.term === 'years' ? 'years' : c.term ?? 'sentenced') : c.outcome ?? '-'

// 1. sys=law records
const law = d.people.filter((p) => d.falls.get(p.id)?.sys === 'law').map((p) => info(p.id)!)
out.push(`## sys=law records: ${law.length}`)
out.push(`grade: ${tally(law.map((x) => x.rec!.grade ?? '-'))}`)
out.push(`outcome: ${tally(law.map((x) => outcome(x.c)))}`)
out.push(`status: ${tally(law.map((x) => x.p.status))}`)
const lawVice = law.filter((x) => VICE.has(x.rec!.grade ?? ''))
out.push(`vice+ (state/minister/vice): ${lawVice.length}; outcome ${tally(lawVice.map((x) => outcome(x.c)))}`)
out.push(`vice+ by first-fall year: ${tally(lawVice.map((x) => x.first.slice(0, 4)))}`)
const capital = lawVice.filter((x) => /death/.test(outcome(x.c)))
out.push(`vice+ death/death-life/death-suspended: ${capital.length} ${capital.map((x) => `${x.p.name}(${outcome(x.c)})`).join(' ')}`)
const lifeOrMore = lawVice.filter((x) => /death|life/.test(outcome(x.c)))
out.push(`vice+ life or heavier: ${lifeOrMore.length}`)
const sentenced = lawVice.filter((x) => x.c.outcome === 'sentenced')
out.push(`vice+ sentenced: ${sentenced.length}; of which life or heavier ${sentenced.filter((x) => /death|life/.test(outcome(x.c))).length}`)
const surr = lawVice.filter((x) => x.rec?.trigger?.kind === 'surrender')
out.push(`vice+ trigger=surrender: ${surr.length} ${surr.map((x) => x.p.name).join(' ')}`)
const inRect = lawVice.filter((x) => x.first >= RECT_FROM && x.first <= RECT_TO)
out.push(`vice+ first fall within rectification ${RECT_FROM}..${RECT_TO}: ${inRect.length} ${inRect.map((x) => `${x.p.name}${x.first}`).join(' ')}`)
const after = lawVice.filter((x) => x.first > RECT_TO)
out.push(`vice+ first fall after ${RECT_TO}: ${after.length}`)
const before = lawVice.filter((x) => x.first < RECT_FROM)
out.push(`vice+ first fall before ${RECT_FROM}: ${before.length}`)
for (const x of lawVice.sort((a, b) => a.first.localeCompare(b.first)))
  out.push(`\t${x.first}\t${x.p.id}\t${x.p.name}\t${x.rec!.grade}\t${outcome(x.c)}\t${x.c.years ?? ''}\t${x.p.headline}`)

// 2. discipline insiders
out.push('')
const dis = DISCIPLINE.map((id) => {
  const x = info(id)
  if (!x) out.push(`MISSING ${id}`)
  return x
}).filter((x) => x !== undefined)
out.push(`## discipline insiders: ${dis.length}`)
out.push(`grade: ${tally(dis.map((x) => x.rec?.grade ?? '-'))}`)
out.push(`sys: ${tally(dis.map((x) => x.rec?.sys ?? '-'))}`)
const disVice = dis.filter((x) => VICE.has(x.rec?.grade ?? ''))
out.push(`vice+ (incl. army general/lieutenant, soe/finance exec): ${disVice.length}`)
out.push(`outcome all: ${tally(dis.map((x) => outcome(x.c)))}`)
out.push(`by year: ${tally(dis.map((x) => x.first.slice(0, 4)))}`)
const disEra = (a: string, b: string) => dis.filter((x) => x.first >= a && x.first <= b).length
out.push(`2012-11..2017-10: ${disEra('2012-11', '2017-10-24')}  2017-10-25..2022-10: ${disEra('2017-10-25', '2022-10-22')}  2022-10-23..: ${disEra('2022-10-23', '9999')}`)
for (const x of dis.sort((a, b) => a.first.localeCompare(b.first)))
  out.push(`\t${x.first}\t${x.p.id}\t${x.p.name}\t${x.rec?.sys}\t${x.rec?.grade}\t${outcome(x.c)}\t${x.p.headline}`)

// site-wide comparison: share of life-or-heavier among sentenced vice+ records
const allVice = d.people.filter((p) => VICE.has(d.falls.get(p.id)?.grade ?? '')).map((p) => info(p.id)!)
const allSent = allVice.filter((x) => x.c.outcome === 'sentenced')
out.push(`site vice+ records ${allVice.length}; sentenced ${allSent.length}; life or heavier ${allSent.filter((x) => /death|life/.test(outcome(x.c))).length}`)
const nonLaw = allSent.filter((x) => x.rec!.sys !== 'law')
out.push(`site vice+ sentenced excl. sys=law ${nonLaw.length}; life or heavier ${nonLaw.filter((x) => /death|life/.test(outcome(x.c))).length}`)
// law-position holders (any sys) whose first fall step falls in the rectification window
const LAWPOS = /公安|法院|检察|政法委|司法厅|司法部|国家安全|监狱/
const winAll = d.people
  .filter((p) => d.falls.get(p.id) && p.fall[0]?.date >= RECT_FROM && p.fall[0]?.date <= RECT_TO)
  .filter((p) => d.falls.get(p.id)!.sys === 'law' || p.positions.some((x) => LAWPOS.test(x.title)))
out.push(`law-position holders (any sys) first fall in window: ${winAll.length} ${winAll.map((p) => `${p.name}/${d.falls.get(p.id)!.grade}/${p.fall[0].date}`).join(' ')}`)

// 3. notice phrases: only the texts cited by the person's own fall steps
out.push('')
const PHR = ['执纪违纪', '知纪违纪', '执法犯法', '知法犯法', '干预司法', '司法活动', '以案谋私', '跑风漏气', '干扰巡视', '妨碍巡视', '对抗巡视', '巡视整改', '巡视工作秘密', '保护伞']
const hits = new Map<string, string[]>()
for (const p of d.people) {
  if (!d.falls.get(p.id)) continue
  const body = p.fall.map((s) => text(s.cite) ?? '').filter((t) => t.includes(p.name)).join('\n')
  for (const ph of PHR) if (body.includes(ph)) hits.set(ph, [...(hits.get(ph) ?? []), p.id])
}
out.push('## phrases (texts cited by the person\'s own fall steps that name them)')
for (const ph of PHR) {
  const l = hits.get(ph) ?? []
  out.push(`${ph}\t${l.length}\t${l.join(' ')}`)
}
const lawViceIds = new Set(lawVice.map((x) => x.p.id))
const disIds = new Set(dis.map((x) => x.p.id))
for (const ph of ['执纪违纪', '执法犯法', '司法活动', '以案谋私']) {
  const l = hits.get(ph) ?? []
  out.push(`${ph}: in law vice+ ${l.filter((id) => lawViceIds.has(id)).length}/${lawViceIds.size} ${l.filter((id) => lawViceIds.has(id)).join(' ')}; in discipline ${l.filter((id) => disIds.has(id)).length}/${disIds.size} ${l.filter((id) => disIds.has(id)).join(' ')}`)
}

// 4. inspection triggers
out.push('')
const recs = d.people.filter((p) => d.falls.get(p.id))
out.push(`## records ${recs.length}; trigger kinds: ${tally(recs.map((p) => d.falls.get(p.id)!.trigger?.kind ?? '-'))}`)
const insp = recs.filter((p) => d.falls.get(p.id)!.trigger?.kind === 'inspect').map((p) => info(p.id)!)
out.push(`inspect: ${insp.length}; grade ${tally(insp.map((x) => x.rec!.grade ?? '-'))}; sys ${tally(insp.map((x) => x.rec!.sys ?? '-'))}`)
out.push(`inspect by year: ${tally(insp.map((x) => x.first.slice(0, 4)))}`)
for (const x of insp.sort((a, b) => a.first.localeCompare(b.first))) out.push(`\t${x.first}\t${x.p.id}\t${x.p.name}\t${x.rec!.grade}\t${outcome(x.c)}`)
const vice18 = recs.map((p) => info(p.id)!).filter((x) => VICE.has(x.rec!.grade ?? '') && x.first >= '2012-11' && x.first <= '2017-10-24')
out.push(`vice+ records first fall 2012-11..2017-10-24: ${vice18.length}; trigger ${tally(vice18.map((x) => x.rec!.trigger?.kind ?? '-'))}`)

// people that official sources say were caught on inspection clues: what does our trigger field say?
const NAMED = {
  'cs10-thepaper-2018-03-06-li-xiaohong': ['sun-zhengcai', 'su-rong', 'zhou-benshun', 'wang-min', 'bai-enpei', 'wang-sanyun', 'huang-xingguo', 'lu-enguang'],
  'cs5-people-2015-04-12-inspection-findings': ['su-rong', 'zhu-mingguo', 'wan-qingliang', 'jin-daoming', 'wu-changshun', 'qin-yuhai'],
  'r01-gov-2014-01-09-inspection-review': ['liao-shaohua', 'guo-youming', 'chen-baihuai', 'chen-anzhong', 'tong-mingqian', 'dai-chunning'],
  'r02-people-2016-01-02-ccdi-2015-tigers': ['liao-yongyuan', 'wu-zhenfang', 'wang-tianpu', 'deng-qilin', 'leng-rongquan', 'chang-xiaobing', 'zhang-yujun', 'yao-gang', 'zhou-laizhen'],
}
for (const [src, ids] of Object.entries(NAMED)) {
  out.push(`named as inspection-clue cases in ${src}:`)
  for (const id of ids) {
    const r = d.falls.get(id)
    out.push(`\t${id}\t${r ? r.trigger?.kind ?? '-' : 'NO RECORD'}`)
  }
}

// notice quotes (as recorded in case records) that mention 巡视
const XS = /巡视(?!员)/
const nq = recs.filter((p) => (d.falls.get(p.id)!.notice?.quotes ?? []).some((q) => XS.test(q)))
out.push(`notice quotes mentioning 巡视: ${nq.length}`)
for (const p of nq) {
  const r = d.falls.get(p.id)!
  out.push(`\t${p.fall[0]?.date}\t${p.id}\t${p.name}\t${r.grade}\t${r.notice!.date}\t${r.notice!.quotes.filter((q) => XS.test(q)).join(' / ')}`)
}

// 5. inspectors
out.push('')
out.push('## inspectors')
for (const id of INSPECTORS) {
  const x = info(id)!
  out.push(`${id}\t${x.p.name}\t${x.first}\t${x.rec?.grade}\t${outcome(x.c)}\t${x.c.years ?? ''}\t${x.p.status}\t${x.p.headline}`)
  for (const s of x.p.fall) out.push(`\t\t${s.date} ${s.text} [${s.cite}]`)
}

writeFileSync('research/scripts/CS10-stats.txt', out.join('\n') + '\n')
console.log('ok')

// Lists the sitting heads of State Council departments and of the main central party and state organs (as of
// 2026-10, from NPC Standing Committee decisions and Xinhua / gov.cn appointment notices), whether a person card
// exists (by name), whether a turns record exists, the card's positions and cites, and which archived source
// texts mention the name.
//   node research/scripts/U09-list.ts   -> .probe/U09-list.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
// [department, post, name]; scholars first
const WHO: [string, string, string][] = [
  ['学者', '原中央编译局副局长', '俞可平'],
  ['学者', '原世界银行首席经济学家', '林毅夫'],
  ['学者', '香港中文大学（深圳）', '郑永年'],
  ['国务院', '国务委员兼秘书长', '吴政隆'],
  ['国务院', '国务委员', '谌贻琴'],
  ['外交部', '部长', '王毅'],
  ['国防部', '部长', '董军'],
  ['国家发展和改革委员会', '主任', '郑栅洁'],
  ['教育部', '部长', '怀进鹏'],
  ['科学技术部', '部长', '阴和俊'],
  ['工业和信息化部', '部长', '李乐成'],
  ['国家民族事务委员会', '主任', '陈瑞峰'],
  ['公安部', '部长', '王小洪'],
  ['国家安全部', '部长', '陈一新'],
  ['民政部', '部长', '李常官'],
  ['司法部', '部长', '贺荣'],
  ['财政部', '部长', '蓝佛安'],
  ['人力资源和社会保障部', '部长', '王晓萍'],
  ['自然资源部', '部长（2026-06 免）', '关志鸥'],
  ['生态环境部', '部长', '黄润秋'],
  ['生态环境部', '党组书记', '孙金龙'],
  ['住房和城乡建设部', '部长', '倪虹'],
  ['交通运输部', '部长', '刘伟'],
  ['水利部', '部长', '李国英'],
  ['农业农村部', '部长', '张柱'],
  ['商务部', '部长', '王文涛'],
  ['文化和旅游部', '部长', '孙业礼'],
  ['国家卫生健康委员会', '主任', '雷海潮'],
  ['退役军人事务部', '部长', '裴金佳'],
  ['应急管理部', '部长', '张成中'],
  ['中国人民银行', '行长', '潘功胜'],
  ['审计署', '审计长', '侯凯'],
  ['最高人民法院', '院长', '张军'],
  ['最高人民检察院', '检察长', '应勇'],
  ['国家监察委员会', '主任', '刘金国'],
  ['中央对外联络部', '部长', '刘海星'],
  ['中央社会工作部', '部长', '吴汉圣'],
  ['中央政策研究室', '主任', '江金权'],
  ['中央网信办', '主任', '庄荣文'],
  ['中央台办', '主任', '宋涛'],
  ['中央港澳办', '主任', '夏宝龙'],
  ['中央港澳办', '主任', '周霁'],
  ['中央财办', '常务副主任', '韩文秀'],
  ['国务院国资委', '主任', '张玉卓'],
  ['国家金融监督管理总局', '局长', '李云泽'],
  ['中国证监会', '主席', '吴清'],
  ['海关总署', '署长', '孙梅君'],
  ['国家税务总局', '局长', '胡静林'],
  ['国家市场监督管理总局', '局长', '罗文'],
  ['新华社', '社长', '傅华'],
  ['人民日报社', '社长', '于绍良'],
  ['中央广播电视总台', '台长', '慎海雄'],
  ['中国社会科学院', '院长', '高翔'],
  ['国务院发展研究中心', '主任', '陆昊'],
  ['中央党史和文献研究院', '院长', '曲青山'],
]
type P = { id: string; name: string; tier: number; headline: string; born?: string; status?: string; cites: string[]; positions?: { title: string; from?: string; to?: string; cite?: string }[]; life?: { h: string; cites: string[] }[] }
const people = new Map<string, P & { file: string }>()
const byName = new Map<string, string[]>()
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  const doc = (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as P[]
  for (const p of doc) {
    people.set(p.id, { ...p, file: f })
    byName.set(p.name, [...(byName.get(p.name) ?? []), p.id])
  }
}
const roster = new Map<string, string[]>()
for (const f of readdirSync(join(ROOT, 'research', 'roster'))) {
  for (const r of (parse(readFileSync(join(ROOT, 'research', 'roster', f), 'utf8')) ?? []) as { id: string; name: string }[]) roster.set(r.name, [...(roster.get(r.name) ?? []), `${r.id}@${f}`])
}
for (const r of (parse(readFileSync(join(ROOT, 'research', 'roster.yaml'), 'utf8')) ?? []) as { id: string; name: string }[]) roster.set(r.name, [...(roster.get(r.name) ?? []), `${r.id}@roster.yaml`])
const turns = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content', 'turns'))) {
  const doc = parse(readFileSync(join(ROOT, 'content', 'turns', f), 'utf8')) ?? {}
  for (const id of Object.keys(doc)) turns.set(id, f)
}
const dir = join(ROOT, 'sources', 'text')
const texts = new Map<string, string>()
for (const f of readdirSync(dir)) if (f.endsWith('.txt')) texts.set(f.slice(0, -4), readFileSync(join(dir, f), 'utf8'))
const out: string[] = []
const todo: string[] = []
for (const [dept, post, name] of WHO) {
  const ids = byName.get(name) ?? []
  const t = ids.map((i) => turns.get(i) ?? '-').join(',') || '-'
  out.push(`## ${dept} ${post} ${name}\tcards=${ids.join(',') || '-'}\troster=${(roster.get(name) ?? []).join(',') || '-'}\tturns=${t}`)
  if (!ids.some((i) => turns.has(i))) todo.push(`${dept}\t${post}\t${name}\t${ids.join(',') || 'NO CARD'}`)
  for (const id of ids) {
    const p = people.get(id)!
    out.push(`  ${p.id} [${p.file}] tier ${p.tier} born ${p.born ?? '?'} status ${p.status ?? '?'} :: ${p.headline}`)
    out.push(`  cites: ${p.cites.join(' ')}`)
    for (const x of p.positions ?? []) out.push(`    ${x.from ?? ''}–${x.to ?? ''} ${x.title} [${x.cite ?? ''}]`)
    for (const l of p.life ?? []) out.push(`    life: ${l.h} [${l.cites.join(' ')}]`)
  }
  const hits = [...texts].filter(([, s]) => s.includes(name)).map(([k, s]) => `${k}(${s.length})`)
  out.push(`  texts(${hits.length}): ${hits.slice(0, 40).join(' ')}`)
}
writeFileSync(join(ROOT, '.probe', 'U09-list.txt'), ['# no turns yet', ...todo, '', ...out].join('\n') + '\n')
console.log(out.length, todo.length)

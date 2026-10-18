// R03 one-off: for every name in scope, find existing person cards (all content/people files), their fall steps and
// status, whether any batch already has a case record, and which archived sources mention them.
//   node research/scripts/R03-scan.ts   -> .probe/R03-scan.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
export const NAMES = `王保安 龚清概 陈雪枫 刘志庚 蔡希有 王珉 卢子跃 王阳 李嘉 杨鲁豫 苏宏章 李成云 张越 杨振超 李云峰 姚中民 尹海林 黄兴国 陈树隆 张文雄 吴天君 卢恩光
魏宏 刘礼祖 曹建方 范坚 颜世元 韩志然 孙清云 张云 刘志勇 贺家铁 张力夫 孔令中 张昆生 赖德荣 郑玉焯
虞海燕 王银成 李文科 陈旭 孙怀山 项俊波 杨崇勇 张化为 周春雨 魏民洲 杨家才 刘善桥 王三运 孙政才 莫建成 鲁炜 刘强 张杰辉
王仲田 李建波 李立国 窦玉沛 夏兴华 杨东平 周化辰 陈传书 刘新齐 曲淑辉 张喜武 王宏江 许前飞 杨焕宁 李刚 夏崇源 何挺 沐华平 吴爱英`
  .split(/\s+/)
  .filter(Boolean)

const people = new Map<string, { id: string; file: string; p: any }[]>()
for (const f of readdirSync(join(ROOT, 'content/people')).filter((f) => f.endsWith('.yaml'))) {
  const list = parse(readFileSync(join(ROOT, 'content/people', f), 'utf8')) ?? []
  for (const p of list) people.set(p.name, [...(people.get(p.name) ?? []), { id: p.id, file: f, p }])
}
const cases = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content/falls')).filter((f) => f.endsWith('.yaml'))) {
  const m = parse(readFileSync(join(ROOT, 'content/falls', f), 'utf8')) ?? {}
  for (const id of Object.keys(m)) cases.set(id, f)
}
const roster = new Map<string, string>()
for (const f of ['research/roster.yaml', ...readdirSync(join(ROOT, 'research/roster')).map((f) => `research/roster/${f}`)]) {
  for (const r of parse(readFileSync(join(ROOT, f), 'utf8')) ?? []) roster.set(r.name, `${r.id} (${f.replace('research/', '')})`)
}
const out: string[] = []
for (const n of NAMES) {
  const hits = people.get(n) ?? []
  out.push(`## ${n}  ${hits.length ? '' : 'NEW'}  roster: ${roster.get(n) ?? '-'}`)
  for (const { id, file, p } of hits) {
    out.push(`  ${id} [${file}] tier ${p.tier} status ${p.status} roles ${p.roles?.join(',')} case: ${cases.get(id) ?? '-'}`)
    out.push(`    headline: ${p.headline}`)
    for (const s of p.fall ?? []) out.push(`    fall ${s.date} ${String(s.text).slice(0, 90)} <${s.cite}>`)
    out.push(`    cites: ${(p.cites ?? []).join(' ')}  wd: ${p.ids?.wikidata ?? '-'}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'R03-scan.txt'), out.join('\n') + '\n')
console.log(`${NAMES.length} names, ${NAMES.filter((n) => !people.has(n)).length} new`)

// R08: the names to do (R06 / A02 rows left undone after R07, and the people the CS1 / CS2 case studies lacked a
// card for), with the cards of the same name in any batch, roster entries and whether a case record exists.
//   node research/scripts/R08-have.ts   -> .probe/R08-have.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type Row = { name: string; date: string; post: string; id?: string; done: boolean; from?: string }
type P = { id: string; name: string; status: string; roles: string[]; fall?: unknown[]; headline?: string }
const people: (P & { file: string })[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as P[]) people.push({ ...p, file: f })
const roster: { id: string; name: string; batch: string }[] = []
for (const f of readdirSync('research/roster').filter((f) => f.endsWith('.yaml')))
  roster.push(...((parse(readFileSync(`research/roster/${f}`, 'utf8')) ?? []) as typeof roster))
roster.push(...((parse(readFileSync('research/roster.yaml', 'utf8')) ?? []) as typeof roster))
const falls = new Map<string, string>()
for (const f of readdirSync('content/falls').filter((f) => f.endsWith('.yaml')))
  for (const id of Object.keys((parse(readFileSync(`content/falls/${f}`, 'utf8')) ?? {}) as object)) falls.set(id, f)
const list = (l: string) => (parse(readFileSync(`research/falls-list/${l}.yaml`, 'utf8')) ?? []) as Row[]
const r07 = list('R07')

const CS = `李铁 陈戌源 苏洪波 徐𬎆 高劲松 田惠宇 王素英 刘奕 鲍学全 王云戈 冯立志 贺文 张华宇 罗敏 蒋兆岗 万仁礼 令完成 谷丽萍 贾晓烨 谢克敏 周吉平 王文志 李建军 张新明 邢利斌 王玉军 黄道国 刘新华 程博明 徐翔 庄心一 刘书帆 李量 李志玲 李峰 方威 李兆前 刘新云 李文喜 娄河 马少伟`.split(' ')

const show = (name: string) => {
  const cands = people.filter((p) => p.name === name)
  const ros = roster.filter((x) => x.name === name && !cands.some((c) => c.id === x.id))
  const c = cands.map((p) => `${p.id}@${p.file}[${p.status};${p.roles.join(',')};fall=${(p.fall ?? []).length};${p.headline ?? ''}]${falls.has(p.id) ? ' FALL@' + falls.get(p.id) : ''}`)
  return `${c.join(' | ')}${ros.length ? ` ROSTER:${ros.map((x) => `${x.id}/${x.batch}`).join(',')}` : ''}`
}
const out: string[] = []
const r06 = list('R06').filter((r) => !r.done && !r07.some((x) => x.from === 'R06' && x.name === r.name && x.date === r.date) && r.name !== '李建波')
out.push(`## R06 left ${r06.length}`)
for (const r of r06) out.push(`R06\t${r.date}\t${r.name}\t${r.post}\t${show(r.name)}`)
const a02 = list('A02').filter((r) => !r.done)
out.push(`## A02 left ${a02.length}`)
for (const r of a02) out.push(`A02\t${r.date}\t${r.name}\t${r.post}\t${show(r.name)}`)
out.push(`## CS`)
for (const n of CS) out.push(`CS\t${n}\t${show(n)}`)
writeFileSync('.probe/R08-have.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

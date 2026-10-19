// For each C12 name: existing cards (name or aka), roster entries, and case records with that id.
//   node research/scripts/C12-check.ts   -> .probe/C12-check.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const NAMES = `曹均章 彭京堂 王洪斌 苏海辉 陈德民 李军 夏志和 陈炽 李士生 殷志红 张立克
刘宏建 杨建华 李仲彬 高先海 王雁飞 古正举
孟庆丰 刘军 许骏 李超 姜洋 黄炜 陈文辉 王东明 刘鸿儒
于丽芳 苏铁志 周建华 姚敏建 宁延令 李安泽 陈卫民
魏鹏远 于铁义 张中生 姜人杰 许迈永
楼忠福 崔晓玉 魏新 范增玉 郑朋 刘琳 于振永 何宏达 林强 石晓春 李全 邵力平 李茂荣 王合清 刘海昌 倪会忠 秦方进 鲁进武`.split(/\s+/)

type P = { id: string; name: string; aka?: string[]; headline?: string; status?: string }
const people: (P & { file: string })[] = []
for (const f of readdirSync(join(ROOT, 'content', 'people'))) {
  const doc = (parse(readFileSync(join(ROOT, 'content', 'people', f), 'utf8')) ?? []) as P[]
  for (const p of doc) people.push({ ...p, file: f })
}
const roster: { id: string; name: string; batch?: string; file: string }[] = []
const rf = [join(ROOT, 'research', 'roster.yaml'), ...readdirSync(join(ROOT, 'research', 'roster')).map((f) => join(ROOT, 'research', 'roster', f))]
for (const f of rf) {
  const doc = (parse(readFileSync(f, 'utf8')) ?? []) as { id: string; name: string; batch?: string }[]
  for (const r of Array.isArray(doc) ? doc : []) roster.push({ ...r, file: f.split(/[\\/]/).pop()! })
}
const cases = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'content', 'falls'))) {
  const doc = parse(readFileSync(join(ROOT, 'content', 'falls', f), 'utf8')) ?? {}
  for (const id of Object.keys(doc)) cases.set(id, f)
}
const out: string[] = []
for (const n of NAMES) {
  const hits = people.filter((p) => p.name === n || p.aka?.includes(n))
  const rs = roster.filter((r) => r.name === n)
  out.push(`${n}: ${hits.map((p) => `${p.id}@${p.file}[${p.status}] ${p.headline}`).join(' | ') || '-'} ;; roster: ${rs.map((r) => `${r.id}@${r.file}`).join(', ') || '-'}`)
}
out.push('', 'case records whose id has no card:')
const ids = new Set(people.map((p) => p.id))
for (const [id, f] of cases) if (!ids.has(id)) out.push(`  ${id} @ ${f}`)
writeFileSync(join(ROOT, '.probe', 'C12-check.txt'), out.join('\n') + '\n')
console.log(out.length)

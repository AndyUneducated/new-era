// Matches the R01 range list against existing person entries: id, batch file, status, fall steps, cites.
//   node research/scripts/R01-match.ts   -> .probe/R01-match.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const names = `李春城 衣俊卿 周镇宏 付晓光 刘铁男 杨琨 倪发科 郭永祥 王素毅 李达球 王永春 李华林 冉新权 王道富 蒋洁敏 齐平景 季建业 廖少华 陈柏槐 郭有明 许杰 戴春宁 陈安众 童名谦 李东生 杨刚 李崇禧
冀文林 祝作利 金道铭 沈培平 姚木根 申维辰 宋林 毛小兵 谭栖伟 王帅廷 阳宝华 赵智勇 苏荣 杜善学 令政策 万庆良 谭力 韩先聪 张田欣 武长顺 杨森林 陈铁新 周永康 陈川平 聂春玉 白云 白恩培 任润厚 孙兆学 潘逸阳 秦玉海 何家成 赵少麟 梁滨 隋凤富 朱明国 王敏 韩学键 令计划 孙鸿志 安德武`.split(/\s+/)

type P = { id: string; name: string; status: string; tier: number; headline: string; fall?: { date: string; text: string; cite: string }[]; cites: string[]; born?: string }
const people: (P & { file: string })[] = []
for (const f of readdirSync(join(ROOT, 'content/people'))) {
  if (!f.endsWith('.yaml')) continue
  try {
    for (const p of (parse(readFileSync(join(ROOT, 'content/people', f), 'utf8')) as P[]) ?? []) people.push({ ...p, file: f })
  } catch (e) {
    console.error(f, (e as Error).message.split('\n')[0])
  }
}
const cases = new Set<string>()
for (const f of readdirSync(join(ROOT, 'content/falls'))) {
  if (!f.endsWith('.yaml') || f.startsWith('R01')) continue
  for (const k of Object.keys(parse(readFileSync(join(ROOT, 'content/falls', f), 'utf8')) ?? {})) cases.add(k)
}
const out: string[] = []
for (const n of names) {
  const hits = people.filter((p) => p.name === n)
  if (!hits.length) out.push(`${n}\t-- none`)
  for (const p of hits) {
    out.push(`${n}\t${p.id}\t${p.file}\t${p.status}\tt${p.tier}\t${p.born ?? ''}\t${p.headline}${cases.has(p.id) ? '\tHAS-CASE' : ''}`)
    for (const s of p.fall ?? []) out.push(`\t\t${s.date}\t${s.text}\t[${s.cite}]`)
    out.push(`\t\tcites: ${p.cites.join(' ')}`)
  }
}
writeFileSync(join(ROOT, '.probe/R01-match.txt'), out.join('\n') + '\n')
console.log(`${names.length} names, ${people.length} people`)

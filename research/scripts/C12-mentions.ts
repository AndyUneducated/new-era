// Which stored source texts mention each C12 name (simplified or traditional form).
//   node research/scripts/C12-mentions.ts   -> .probe/C12-mentions.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const NAMES: Record<string, string[]> = {
  曹均章: ['曹均彰'], 彭京堂: [], 王洪斌: [], 苏海辉: ['蘇海輝'], 陈德民: ['陳德民'], 夏志和: [], 陈炽: ['陳熾'], 李士生: [], 殷志红: ['殷志紅'], 张立克: ['張立克'],
  刘宏建: ['劉宏建'], 杨建华: ['楊建華'], 李仲彬: [], 高先海: [], 王雁飞: ['王雁飛'], 古正举: ['古正舉'],
  孟庆丰: ['孟慶豐'], 许骏: ['許駿'], 姜洋: [], 黄炜: ['黃煒'], 陈文辉: ['陳文輝'], 刘鸿儒: ['劉鴻儒'],
  于丽芳: ['于麗芳'], 苏铁志: ['蘇鐵志'], 周建华: ['周建華'], 姚敏建: [], 宁延令: ['寧延令'], 李安泽: ['李安澤'], 陈卫民: ['陳衛民'],
  魏鹏远: ['魏鵬遠'], 于铁义: ['于鐵義'], 张中生: ['張中生'], 姜人杰: ['姜人傑'], 许迈永: ['許邁永'],
  楼忠福: ['樓忠福'], 崔晓玉: ['崔曉玉'], 范增玉: [], 郑朋: ['鄭朋'], 刘琳: ['劉琳'], 于振永: [], 何宏达: ['何宏達'], 林强: ['林強'], 石晓春: ['石曉春'], 李全: [],
  邵力平: [], 李茂荣: [], 王合清: [], 刘海昌: [], 倪会忠: [], 秦方进: [], 鲁进武: [],
}
const dir = join(ROOT, 'sources', 'text')
const texts = readdirSync(dir).map((f) => [f.replace(/\.txt$/, ''), readFileSync(join(dir, f), 'utf8')] as const)
const out: string[] = []
for (const [n, alt] of Object.entries(NAMES)) {
  const forms = [n, ...alt]
  const hits = texts.filter(([, t]) => forms.some((x) => t.includes(x))).map(([id, t]) => `${id}(${forms.reduce((s, x) => s + t.split(x).length - 1, 0)})`)
  out.push(`${n}: ${hits.join(' ')}`)
}
writeFileSync(join(ROOT, '.probe', 'C12-mentions.txt'), out.join('\n') + '\n')
console.log(out.length)

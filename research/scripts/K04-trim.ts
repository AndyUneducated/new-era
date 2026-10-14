// K04: propose start/end markers for the fetched fall/death sources (first body paragraph naming the subject,
// last body paragraph before the page footer). Writes .probe/K04-trim.txt for review.
//   node research/scripts/K04-trim.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCES } from './K04-sources.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const FOOT = /^(【纠错】|【责任编辑|责任编辑|\(责编|（责编|责编|编辑：|编辑:|分享|扫一扫|相关新闻|相关链接|版权|Copyright|服务邮箱|人民日报违法|关键词|\[责任编辑)/
const out: string[] = []
for (const s of SOURCES) {
  const f = join(ROOT, 'sources', 'text', `${s.id}.txt`)
  if (!existsSync(f)) { out.push(`### ${s.id} MISSING`); continue }
  const all = readFileSync(f, 'utf8')
  const lines = all.split('\n').map((l) => l.trim()).filter(Boolean)
  const first = lines.findIndex((l) => l.includes(s.who) && l.length >= 30 && !l.startsWith('#') && l !== s.title)
  let last = -1
  for (let k = Math.max(0, first); k < lines.length; k++) {
    if (FOOT.test(lines[k])) break
    if (lines[k].length >= 20 && /[。）)」”]$/.test(lines[k])) last = k
  }
  const start = first >= 0 ? lines[first].slice(0, 14) : ''
  const end = last >= 0 ? lines[last].slice(-14) : ''
  const i = start ? all.indexOf(start) : -1
  const j = end ? all.indexOf(end, Math.max(0, i)) : -1
  const body = i >= 0 && j >= 0 ? all.slice(i, j + end.length) : ''
  out.push(`### ${s.id} total=${all.length} body=${body.length} who=${all.includes(s.who)}`)
  out.push(`  start: ${JSON.stringify(start)}  end: ${JSON.stringify(end)}`)
  out.push(`  HEAD ${body.slice(0, 160).replace(/\n/g, '⏎')}`)
  out.push(`  TAIL ${body.slice(-90).replace(/\n/g, '⏎')}`)
}
writeFileSync(join(ROOT, '.probe', 'K04-trim.txt'), out.join('\n') + '\n')

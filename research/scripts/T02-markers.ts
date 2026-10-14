// T02: derive start/end markers for official notices from the --peek text (.probe/peek-<id>.txt).
// start = the first paragraph that names the person; end = the last paragraph before page boilerplate.
// Writes .probe/T02-markers.json { id: { start, end } }. Usage: node research/scripts/T02-markers.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { SOURCES } from './T02-sources.ts'

const root = join(import.meta.dirname, '..', '..')
const BOILER =
  /^(【?责任编辑|（责任编辑|\(责任编辑|【纠错】|【我要纠错】|扫一扫|分享到|分享：|相关新闻|相关阅读|相关链接|打印|关闭窗口|版权所有|网站地图|返回顶部|上一篇|下一篇|热点推荐|推荐阅读|编辑：|责编：|审核：|监制：|延伸阅读|新华网版权|Copyright|附件：|【打印】|©|京ICP|点赞|相关推荐|相关文章|热门推荐|责任编辑|分享让更多人看到|举报|来源：人民网－|\[责任编辑|（编辑|返回首页)/
const out: Record<string, { start: string; end: string } | { error: string }> = {}

function marker(paras: string[], k: number, fromEnd: boolean, all: string, after: number): string {
  const p = paras[k]
  for (let n = Math.min(14, p.length); n <= p.length; n += 4) {
    const s = fromEnd ? p.slice(-n) : p.slice(0, n)
    const i = all.indexOf(s, after)
    const want = all.indexOf(p, after) + (fromEnd ? p.length - s.length : 0)
    if (i === want) return s
  }
  return p
}

for (const s of SOURCES) {
  if (s.full === false) continue
  const f = join(root, '.probe', `peek-${s.id}.txt`)
  if (!existsSync(f)) {
    out[s.id] = { error: 'no peek' }
    continue
  }
  const all = readFileSync(f, 'utf8')
  const paras = all.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const name = s.who
  const sentence = (p: string) => p.length > 25 && /[。；]/.test(p)
  const a = paras.findIndex((p) => p.includes(name) && sentence(p))
  if (a < 0) {
    out[s.id] = { error: `name ${name} not found` }
    continue
  }
  let b = a
  for (let k = a + 1; k < paras.length; k++) {
    if (BOILER.test(paras[k])) break
    if (/[。；）)]$/.test(paras[k]) || sentence(paras[k])) b = k
  }
  const start = marker(paras, a, false, all, 0)
  const sIdx = all.indexOf(start)
  const end = marker(paras, b, true, all, sIdx)
  out[s.id] = { start, end }
}
writeFileSync(join(root, '.probe/T02-markers.json'), JSON.stringify(out, null, 1), 'utf8')
console.log(Object.keys(out).length)

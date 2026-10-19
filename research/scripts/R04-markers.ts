// Derives start/end markers for R04 manifest entries from .probe/peek-<id>.txt and writes them into
// research/manifests/R04.yaml (flow-style entries only). Review .probe/R04-markers.txt before fetching.
//   node research/scripts/R04-markers.ts [--write] [id ...]
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const args = process.argv.slice(2)
const write = args.includes('--write')
const only = new Set(args.filter((a) => !a.startsWith('--')))
const path = 'research/manifests/R04.yaml'
let yamlText = readFileSync(path, 'utf8')
const web: { id: string; title: string; publisher: string; start?: string; excerpt?: boolean }[] = parse(yamlText).web

const footer = /^(\(|（)?责任?编|^【纠错】|^©|版权所有|^相关新闻|^推荐阅读|^分享到|^扫一扫|客户端下载|^打印|^关闭窗口|^上一篇|^下一篇|^\[责任编辑|^编辑[:：]|^责编|^【编辑|^声明：|^免责声明|^延伸阅读|^原文链接|^点击进入|^返回顶部/
const report: string[] = []

for (const e of web) {
  if (e.start || e.excerpt || (only.size && !only.has(e.id))) continue
  const pf = `.probe/peek-${e.id}.txt`
  if (!existsSync(pf)) {
    report.push(`## ${e.id}\n  NO PEEK`)
    continue
  }
  const paras = readFileSync(pf, 'utf8').split(/\n+/).map((p) => p.trim()).filter(Boolean)
  let s = -1
  if (e.publisher === '中央纪委国家监委网站') {
    const w = paras.findIndex((p, i) => p === '微信' && i < paras.length - 1)
    s = w + 1
  } else {
    s = paras.findIndex((p, i) => i > 0 && p.length >= 40 && /[。”）)]$/.test(p))
  }
  if (s <= 0) {
    report.push(`## ${e.id}\n  NO START`)
    continue
  }
  let t = s
  while (t + 1 < paras.length && !footer.test(paras[t + 1])) t++
  while (t > s && paras[t].length < 12 && !/[。）)]$/.test(paras[t])) t--
  const all = paras.join('\n')
  const sPos = all.indexOf(paras[s])
  let start = ''
  for (let n = 10; n <= paras[s].length; n++) {
    start = paras[s].slice(0, n)
    if (all.indexOf(start) === sPos) break
  }
  const ePos = all.indexOf(paras[t], sPos) + paras[t].length
  let end = ''
  for (let n = 8; n <= paras[t].length; n++) {
    end = paras[t].slice(-n)
    if (all.indexOf(end, sPos) + end.length === ePos) break
  }
  report.push(`## ${e.id}  [${t - s + 1} paras]\n  S: ${paras[s].slice(0, 70)}\n  E: …${paras[t].slice(-70)}\n  start=${start} | end=${end}`)
  if (write) {
    const re = new RegExp(`(- \\{ id: ${e.id},[^\\n]*?url: "[^"]*")( \\})`)
    if (re.test(yamlText)) yamlText = yamlText.replace(re, `$1, start: ${JSON.stringify(start)}, end: ${JSON.stringify(end)}$2`)
    else report.push(`  (not flow-style; add markers by hand)`)
  }
}
if (write) writeFileSync(path, yamlText, 'utf8')
writeFileSync('.probe/R04-markers.txt', report.join('\n') + '\n', 'utf8')

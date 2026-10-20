// BD1: looser birth-date scan of all archived texts for people still missing born (reads .probe/bd1-left.txt)
//   node research/scripts/BD1-probe2.ts  -> .probe/bd1-probe2.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const left = readFileSync('.probe/bd1-left.txt', 'utf8').split('# no positions')[0].split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'))
const texts = new Map<string, string>()
for (const f of readdirSync('sources/text')) texts.set(f.replace(/\.txt$/, ''), readFileSync(`sources/text/${f}`, 'utf8'))
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const out: string[] = []
for (const [id, name, , , , cites] of left) {
  const cited = new Set((cites ?? '').split(','))
  const re = new RegExp(`${esc(name)}[^。\\n]{0,60}?(\\d{4})年(\\d{1,2}月)?(\\d{1,2}日)?[^。\\n]{0,4}?生|${esc(name)}[^。\\n]{0,30}?生于(\\d{4})年|${esc(name)}[^。\\n]{0,30}?(\\d{2,3})岁`, 'g')
  const hits: string[] = []
  for (const [src, t] of texts) {
    if (!t.includes(name)) continue
    for (const m of t.matchAll(re)) {
      hits.push(`   ${cited.has(src) ? '*' : ' '} ${src}: ${t.slice(m.index!, m.index! + m[0].length + 25).replace(/\s+/g, ' ')}`)
      if (hits.length > 5) break
    }
    if (hits.length > 5) break
  }
  if (hits.length) out.push(`${id}\t${name}`, ...hits)
}
writeFileSync('.probe/bd1-probe2.txt', out.join('\n') + '\n', 'utf8')

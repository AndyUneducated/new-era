// BD2: birth-like phrases in every text that mentions a listed person (name within 200 chars of the phrase)
//   node research/scripts/BD2-cited.ts  -> .probe/bd2-cited.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'

const probe = JSON.parse(readFileSync('.probe/bd2-probe.json', 'utf8')) as any[]
const texts = new Map<string, string>()
for (const f of readdirSync('sources/text')) texts.set(f.replace(/\.txt$/, ''), readFileSync(`sources/text/${f}`, 'utf8'))
const re = /(19[2-9]\d|200\d)\s*年\s*(\d{1,2}\s*月)?\s*(\d{1,2}\s*日)?\s*(出\s*)?生|生于\s*(19[2-9]\d)|(19[2-9]\d)\s*年\s*(\d{1,2}\s*月)?\s*(\d{1,2}\s*日)?\s*出世|[（(](19[2-9]\d)年(\d{1,2}月)?(\d{1,2}日)?\s*[—－-]|(\d{2,3})\s*岁/g
const out: string[] = []
for (const p of probe) {
  const lines: string[] = []
  for (const [id, t] of texts) {
    if (!t.includes(p.name)) continue
    for (const m of t.matchAll(re)) {
      const lo = Math.max(0, m.index! - 200)
      const ctx = t.slice(lo, m.index! + m[0].length + 10)
      const k = ctx.lastIndexOf(p.name)
      if (k < 0) continue
      const near = ctx.slice(k).replace(/\s+/g, ' ')
      if (near.length > 160) continue
      lines.push(`   ${id}: ${near}`)
      if (lines.length > 10) break
    }
    if (lines.length > 10) break
  }
  out.push(`${p.id}\t${p.name}`)
  out.push(...lines)
}
writeFileSync('.probe/bd2-cited.txt', out.join('\n') + '\n', 'utf8')

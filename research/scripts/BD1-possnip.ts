// BD1: for people still without positions, show snippets around their name in already-cited texts
//   node research/scripts/BD1-possnip.ts  -> .probe/bd1-possnip.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const raw = readFileSync('.probe/bd1-left.txt', 'utf8').split('# no positions')[1] ?? ''
const rows = raw.split('\n').slice(1).filter(Boolean).map((l) => l.replace(/\r$/, '').split('\t'))
const kw = /任|主席|教授|律师|记者|司令|院长|总裁|总经理|主任|主编|董事|书记|部长|所长|局长|创办|负责人|理事|研究员|作家|商人|老板|董事长|股东|店长|医生|军医|副|员/
const out: string[] = []
for (const [id, name, , , headline, cites] of rows) {
  out.push(`## ${id}\t${name}\t${headline}`)
  const names = [name, ...(name.length > 2 ? [] : [])]
  for (const c of (cites ?? '').split(',')) {
    const f = `sources/text/${c}.txt`
    if (!existsSync(f)) continue
    const t = readFileSync(f, 'utf8').replace(/\s+/g, ' ')
    const hits: string[] = []
    for (const n of names) {
      let i = t.indexOf(n)
      while (i >= 0 && hits.length < 3) {
        const s = t.slice(Math.max(0, i - 50), i + 70)
        if (kw.test(s)) hits.push(s)
        i = t.indexOf(n, i + 70)
      }
    }
    for (const h of hits) out.push(`   [${c}] ${h}`)
  }
}
writeFileSync('.probe/bd1-possnip.txt', out.join('\n') + '\n', 'utf8')

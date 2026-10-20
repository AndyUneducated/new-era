// RL7: print the body lines (no reference list, no navbox noise) of archived source texts → .probe/rl7-peek.txt
// usage: node research/scripts/RL7-peek.ts id1 id2 ...   (an id may end with * to match a prefix)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'

const all = readdirSync(path('sources', 'text')).map((f) => f.replace(/\.txt$/, ''))
const ids = process.argv.slice(2).flatMap((a) => (a.endsWith('*') ? all.filter((x) => x.startsWith(a.slice(0, -1))) : [a]))
const out: string[] = []
for (const id of ids) {
  const f = path('sources', 'text', `${id}.txt`)
  out.push(`=== ${id}`)
  if (!existsSync(f)) {
    out.push('  (missing)')
    continue
  }
  for (const l of readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (l.trim().length < 8 || /^\^|取自“|分类：|本页面最后|页面存档备份/.test(l.trim())) continue
    out.push(l.trim().slice(0, 600))
  }
}
writeFileSync(path('.probe', 'rl7-peek.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

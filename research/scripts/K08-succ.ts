// K08: succession hints for list people still without relations. Scans every archived text for
// (1) sentences with 接替/接任/继任/前任/搭档 naming the person, (2) wiki succession boxes (前任：/继任： blocks)
// in texts whose title starts with the person's name. → .probe/K08-succ.txt
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const src = new Map(d.sources.map((s) => [s.id, s]))
const kw = /接替|接任|继任|前任|搭档|搭班子|老部下|提拔|栽培|继其|交接/
const out: string[] = []
for (const [id, name] of list) {
  if (related.has(id) || name.length < 2) continue
  out.push(`######## ${name} (${id})`)
  const seen = new Set<string>()
  for (const [sid, t] of d.texts) {
    if (!t.includes(name)) continue
    const title = (src.get(sid) as { title?: string } | undefined)?.title ?? ''
    if (title.startsWith(name) && /wiki|wp-/.test(sid)) {
      const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean)
      lines.forEach((l, i) => {
        if (/^(前任|继任)[：:]?$/.test(l) || /^(前任|继任)\S{1,6}$/.test(l)) {
          const ctx = lines.slice(Math.max(0, i - 2), i + 3).join(' / ')
          if (!seen.has(ctx)) (seen.add(ctx), out.push(`  BOX [${sid}] ${ctx.slice(0, 200)}`))
        }
      })
    }
    for (const s of t.split(/(?<=[。；！？\n])/)) {
      const x = s.trim()
      if (x.length > 300 || !x.includes(name) || !kw.test(x) || seen.has(x)) continue
      seen.add(x)
      out.push(`   [${sid}] ${x.slice(0, 220)}`)
    }
  }
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'K08-succ.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

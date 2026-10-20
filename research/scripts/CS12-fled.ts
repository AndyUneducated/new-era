// CS12: list people and case records whose outcome is fled, or whose statusNote / fall / bio mentions fleeing abroad
import { readFileSync, writeFileSync } from 'node:fs'

const db = JSON.parse(readFileSync('public/data/db.json', 'utf8'))
const more = JSON.parse(readFileSync('public/data/more.json', 'utf8'))
console.log('more keys', Object.keys(more))
const re = /外逃|潜逃|出逃|逃往|红通|红色通缉|猎狐|天网|遣返|劝返|引渡|缺席审判|追逃|逃亡|滞留/
const out: string[] = []
const seen = new Set<string>()
const scan = (where: string, id: string, s: unknown) => {
  const t = typeof s === 'string' ? s : JSON.stringify(s ?? '')
  const m = t.match(re)
  if (m) {
    const i = t.indexOf(m[0])
    out.push(`${where}\t${id}\t${m[0]}\t${t.slice(Math.max(0, i - 80), i + 120).replace(/\s+/g, ' ')}`)
    seen.add(id)
  }
}
for (const p of db.people) {
  scan('statusNote', p.id, p.statusNote)
  scan('fall', p.id, p.fall)
  scan('headline', p.id, p.headline)
}
for (const [k, v] of Object.entries(more)) {
  if (Array.isArray(v)) for (const x of v as any[]) if (x?.id) scan(`more.${k}`, x.id, x)
  else if (v && typeof v === 'object') for (const [id, x] of Object.entries(v as any)) scan(`more.${k}`, id, x)
}
for (const e of db.events) scan('event', e.id, e.title + ' ' + e.summary)
for (const c of db.cases) scan('case', c.id, c)
writeFileSync('.probe/cs12-fled.txt', out.join('\n'), 'utf8')
console.log(out.length, seen.size)

// Who is on the PH11 list: id, name, headline, born, first positions and bio start of each person on
// research/lists/R16-photo-next2.txt (plus the four PH10 removals), into .probe/PH11-who.tsv, for writing searches.
//   node research/scripts/PH11-who.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

const extra = ['liu-zemin', 'su-xintian', 'jiang-guoping', 'wang-yong-jx']
const ids = [
  ...readFileSync('research/lists/R16-photo-next2.txt', 'utf8')
    .split('\n')
    .filter((l) => l.startsWith('rank'))
    .map((l) => l.split('\t')[1]),
  ...extra,
]
const cards = new Map<string, any>()
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml'))) {
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as any[]) if (p?.id) cards.set(p.id, p)
}
const rows = ids.map((id) => {
  const p = cards.get(id) ?? {}
  const pos = (p.positions ?? [])
    .slice(-4)
    .map((x: any) => `${x.from ?? ''}-${x.to ?? ''} ${x.title ?? x.org ?? ''}`)
    .join('; ')
  return [id, p.name, p.headline, p.born ?? '', pos, String(p.bio ?? '').replace(/\s+/g, ' ').slice(0, 200)].join('\t')
})
writeFileSync('.probe/PH11-who.tsv', rows.join('\n') + '\n')
console.log(rows.length)

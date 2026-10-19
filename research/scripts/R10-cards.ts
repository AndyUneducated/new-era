import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
const want = process.argv.slice(2)
const out: string[] = []
for (const f of readdirSync('content/people').filter((f) => f.endsWith('.yaml')))
  for (const p of (parse(readFileSync(`content/people/${f}`, 'utf8')) ?? []) as any[])
    if (want.includes(p.id)) out.push(`######## ${p.id} @${f}\n` + JSON.stringify({ name: p.name, born: p.born, status: p.status, statusNote: p.statusNote, headline: p.headline, fall: p.fall, positions: p.positions, cites: p.cites, bio: p.bio }, null, 1))
writeFileSync('.probe/R10-cards.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

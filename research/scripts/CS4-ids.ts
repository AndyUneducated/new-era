// CS4: people cards by id, name, or headline pattern; also event / faction / source ids
// usage: node research/scripts/CS4-ids.ts [--re=正则] 名字或id ...
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

type Card = { id: string; name: string; file: string; headline: string; status: string }
const cards: Card[] = []
for (const f of readdirSync('content/people')) {
  if (!f.endsWith('.yaml')) continue
  const t = readFileSync(`content/people/${f}`, 'utf8')
  for (const block of t.split(/^(?=- id: )/m)) {
    const id = block.match(/^- id: ([a-z0-9-]+)/)?.[1]
    if (!id) continue
    const name = block.match(/^\s+name: (\S+)/m)?.[1] ?? ''
    const headline = block.match(/^\s+headline: (.*)$/m)?.[1] ?? ''
    const status = block.match(/^\s+status: (\S+)/m)?.[1] ?? ''
    cards.push({ id, name, file: f, headline, status })
  }
}
const known = new Map<string, string>()
for (const dir of ['content/events', 'content/factions', 'research/manifests']) {
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.yaml')) continue
    const t = readFileSync(`${dir}/${f}`, 'utf8')
    const re = /^\s*-\s*\{?\s*id:\s*([a-z0-9-]+)/gm
    let m
    while ((m = re.exec(t))) known.set(m[1], `${dir}/${f}`)
  }
}
const out: string[] = []
const line = (c: Card) => `${c.id}\t${c.name}\t${c.status}\t${c.headline}\t(${c.file})`
for (const a of process.argv.slice(2)) {
  if (a.startsWith('--re=')) {
    const re = new RegExp(a.slice(5))
    for (const c of cards) if (re.test(c.headline)) out.push(line(c))
    continue
  }
  const byId = cards.find(c => c.id === a)
  if (byId) { out.push(line(byId)); continue }
  const byName = cards.filter(c => c.name === a)
  if (byName.length) { out.push(...byName.map(line)); continue }
  out.push(`${a}\t${known.get(a) ?? 'MISSING'}`)
}
mkdirSync('.probe', { recursive: true })
writeFileSync('.probe/CS4-ids.txt', out.join('\n') + '\n')

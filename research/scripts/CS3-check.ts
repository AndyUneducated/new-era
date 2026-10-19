// CS3: check which event / faction / source ids exist; usage: node research/scripts/CS3-check.ts id ...
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
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
const out = process.argv.slice(2).map(q => `${q}\t${known.get(q) ?? 'MISSING'}`)
mkdirSync('.probe', { recursive: true })
writeFileSync('.probe/CS3-check.txt', out.join('\n') + '\n')

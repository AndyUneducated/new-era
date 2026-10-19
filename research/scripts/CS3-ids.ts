// CS3: which people ids / names have cards; usage: node research/scripts/CS3-ids.ts 名字或id ...
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const dir = 'content/people'
const ids = new Map<string, string>()
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.yaml')) continue
  const t = readFileSync(`${dir}/${f}`, 'utf8')
  const re = /^- id: ([a-z0-9-]+)\s*\n\s+name: (\S+)/gm
  let m
  while ((m = re.exec(t))) ids.set(m[1], `${m[2]} (${f})`)
}
const out: string[] = []
for (const q of process.argv.slice(2)) {
  if (ids.has(q)) out.push(`${q}\t${ids.get(q)}`)
  else {
    const hits = [...ids].filter(([, v]) => v.startsWith(q + ' '))
    out.push(hits.length ? hits.map(([k, v]) => `${q}\t${k}\t${v}`).join('\n') : `${q}\tMISSING`)
  }
}
mkdirSync('.probe', { recursive: true })
writeFileSync('.probe/CS3-ids.txt', out.join('\n') + '\n')

// Find already-fetched sources (any batch) that carry a resume for K06 people with few positions.
import fs from 'node:fs'
import path from 'node:path'

const data: { name: string; id: string }[] = JSON.parse(fs.readFileSync('.probe/K06-data.json', 'utf8'))
const rep = fs.readFileSync('.probe/K06-cards.txt', 'utf8')
const few = new Set([...rep.matchAll(/FEW POSITIONS \(\d\) \S+ (\S+)/g)].map((m) => m[1]))
const dir = 'sources/text'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt'))
const texts = files.map((f) => [f.replace(/\.txt$/, ''), fs.readFileSync(path.join(dir, f), 'utf8')] as const)
const out: string[] = []
for (const p of data.filter((d) => few.has(d.id))) {
  out.push(`## ${p.name} ${p.id}`)
  for (const [sid, t] of texts) {
    const i = t.search(new RegExp(`${p.name}，(男|女)|${p.name}（\\d{4}年`))
    if (i < 0) continue
    const yrs = (t.slice(i, i + 3000).match(/\d{4}\.\d{2}|\d{4}年\d{1,2}月/g) ?? []).length
    out.push(`  ${sid} [${yrs}] ${t.slice(i, i + 80).replace(/\s+/g, ' ')}`)
  }
}
fs.writeFileSync('.probe/K06-resumes.txt', out.join('\n'), 'utf8')

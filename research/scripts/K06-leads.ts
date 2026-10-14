// One-off: dump the lead paragraph of each K06 person's Wikipedia excerpt, to design the card generator.
// node research/scripts/K06-leads.ts  ->  .probe/K06-leads.txt
import fs from 'node:fs'

const data = JSON.parse(fs.readFileSync('.probe/K06-data.json', 'utf8')) as { name: string; key: string; id: string }[]
const wiki = JSON.parse(fs.readFileSync('.probe/K06-wiki.json', 'utf8')) as Record<string, string>
const out: string[] = []
for (const p of data) {
  const sid = wiki[p.key]
  let t = ''
  try {
    t = fs.readFileSync(`sources/text/${sid}.txt`, 'utf8')
  } catch {
    out.push(`${p.id}\t${sid}\tNO TEXT`)
    continue
  }
  const paras = t.split(/\n\s*\n/).map((s) => s.trim())
  const lead = paras.find((s) => s.startsWith(p.name) && /（\d{4}年/.test(s)) ?? paras.find((s) => /（\d{4}年/.test(s)) ?? ''
  out.push(`${p.id}\t${sid}\t${lead.replace(/\s+/g, ' ').slice(0, 400)}`)
}
fs.writeFileSync('.probe/K06-leads.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length, 'leads;', out.filter((l) => l.endsWith('\t')).length, 'empty')

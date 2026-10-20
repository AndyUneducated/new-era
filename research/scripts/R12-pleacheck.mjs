// print the mitigation sentences of each planned plea cite: node research/scripts/R12-pleacheck.mjs out.txt person=cite ...
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
const [out, ...pairs] = process.argv.slice(2)
const re = /自首|立功|揭发|检举|退赃|退缴|退赔|退还|认罪|悔罪|认罚/
const res = []
for (const pair of pairs) {
  const [id, cite] = pair.split('=')
  const f = `sources/text/${cite}.txt`
  if (!existsSync(f)) { res.push(`=== ${id} ${cite} NO TEXT`); continue }
  const hits = readFileSync(f, 'utf8').split(/(?<=。)|\n/).filter((s) => re.test(s)).map((s) => s.trim())
  res.push(`=== ${id} ${cite}`, ...(hits.length ? hits : ['(no hit)']))
}
writeFileSync(out, res.join('\n'), 'utf8')
console.log('ok')

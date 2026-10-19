// R07 digest of the fetched notices per person: expulsion findings, verdict holding and sum, other court texts.
//   node research/scripts/R07-digest.ts who ...   -> .probe/R07-digest.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

const files = readdirSync('sources/text').filter((f) => f.startsWith('r07-'))
const out: string[] = []
for (const who of process.argv.slice(2)) {
  out.push(`######## ${who}`)
  for (const f of files.filter((f) => f.endsWith(`-${who}-probe.txt`) || f.endsWith(`-${who}-expel.txt`) || f.endsWith(`-${who}-verdict.txt`) || f.endsWith(`-${who}-trial.txt`) || f.endsWith(`-${who}-end.txt`) || f.endsWith(`-${who}-other.txt`))) {
    let t = readFileSync(`sources/text/${f}`, 'utf8').replace(/\s*\n+\s*/g, ' ¶ ')
    if (f.endsWith('-expel.txt')) t = t.replace(/依据《中国共产党纪律处分条例》.*?决定给予/, '…决定给予')
    if (f.endsWith('-verdict.txt')) t = t.replace(/鉴于.*$/, '…')
    out.push(`  [${f.replace('.txt', '')}]\n    ${t}`)
  }
  const wiki = `sources/text/r07-wiki-${who}.txt`
  if (existsSync(wiki)) out.push(`  [wiki]\n    ${readFileSync(wiki, 'utf8').replace(/\s*\n+\s*/g, ' ¶ ').slice(0, 1200)}`)
}
writeFileSync('.probe/R07-digest.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

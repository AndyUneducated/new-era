import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
const out: string[] = []
for (const f of readdirSync('sources/text')) {
  if (!f.startsWith('i06-')) continue
  const t = readFileSync(`sources/text/${f}`, 'utf8')
  out.push(`== ${f} (${t.length})\nHEAD: ${t.slice(0, 120).replace(/\n/g, ' / ')}\nTAIL: ${t.slice(-240).replace(/\n/g, ' / ')}\n`)
}
writeFileSync('.probe/I06-tails.txt', out.join('\n'), 'utf8')

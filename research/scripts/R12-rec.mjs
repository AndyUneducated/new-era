// print the raw case records of the given ids with file and line numbers: node research/scripts/R12-rec.mjs out.txt id...
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
const [out, ...ids] = process.argv.slice(2)
const want = new Set(ids)
const res = []
for (const f of readdirSync('content/falls').filter((x) => x.endsWith('.yaml'))) {
  const lines = readFileSync(`content/falls/${f}`, 'utf8').split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([a-z0-9-]+):\s*$/)
    if (!m || !want.has(m[1])) continue
    let j = i + 1
    while (j < lines.length && !/^[a-z0-9-]+:\s*$/.test(lines[j])) j++
    res.push(`=== ${m[1]} ${f}:${i + 1}`)
    for (let k = i; k < j; k++) res.push(`${k + 1}| ${lines[k]}`)
    want.delete(m[1])
  }
}
res.push(`MISSING: ${[...want].join(' ')}`)
writeFileSync(out, res.join('\n'), 'utf8')
console.log('ok')

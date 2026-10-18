// R03 one-off: concatenate archived source texts (by id prefix or explicit ids) into one file for reading.
//   node research/scripts/R03-digest.ts <out-name> id-or-prefix ...   -> .probe/R03-<out-name>.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

const [name, ...want] = process.argv.slice(2)
const files = readdirSync('sources/text').filter((f) => want.some((w) => f === `${w}.txt` || (w.endsWith('*') && f.startsWith(w.slice(0, -1)))))
const out = files.map((f) => `=== ${f.replace(/\.txt$/, '')}\n${readFileSync(`sources/text/${f}`, 'utf8').replace(/\n{2,}/g, '\n')}`)
for (const w of want) if (!w.endsWith('*') && !existsSync(`sources/text/${w}.txt`)) out.push(`=== ${w} MISSING`)
writeFileSync(`.probe/R03-${name}.txt`, out.join('\n'))
console.log(`${files.length} files`)

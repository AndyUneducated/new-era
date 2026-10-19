// node research/scripts/R10-dump.ts <tag> <who1> <who2> ...  → .probe/R10-dump-<tag>.txt
// Concatenates sources/text/r10-*<who>*.txt (and any other text ids given with '=' prefix).
import fs from 'node:fs'
import path from 'node:path'

const [tag, ...whos] = process.argv.slice(2)
const dir = 'sources/text'
const files = fs.readdirSync(dir)
let out = ''
for (const w of whos) {
  const hits = w.startsWith('=') ? [w.slice(1) + '.txt'] : files.filter((f) => f.startsWith('r10-') && f.includes(w))
  for (const f of hits) {
    const p = path.join(dir, f)
    if (!fs.existsSync(p)) { out += `\n##### MISSING ${f}\n`; continue }
    out += `\n##### ${f.replace(/\.txt$/, '')}\n` + fs.readFileSync(p, 'utf8') + '\n'
  }
}
fs.mkdirSync('.probe', { recursive: true })
fs.writeFileSync(`.probe/R10-dump-${tag}.txt`, out)
console.log(out.length)

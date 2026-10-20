// C16: lines naming each pending person in saved list pages (Wikipedia lists etc.), to see who has a verdict.
// node research/scripts/C16-scan.ts file1 file2 ...  ->  .probe/c16-scan.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const list = readFileSync(join(ROOT, 'research/lists/R17-pending-cases.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const lines = process.argv.slice(2).flatMap((f) => readFileSync(f, 'utf8').split(/\n/))
const out: string[] = []
for (const [id, name, , sys] of list) {
  if (sys === 'other' || sys === 'army') continue
  const n = name.length === 2 ? [name, `${name[0]} ${name[1]}`] : [name]
  const hits = lines.filter((l) => n.some((x) => l.includes(x)) && /判|宣判|起诉|开庭|徒刑|死刑|无期/.test(l))
  if (hits.length) out.push(`## ${id} ${name}`, ...hits.map((h) => '  ' + h.slice(0, 300)), '')
}
writeFileSync(join(ROOT, '.probe/c16-scan.txt'), out.join('\n'))

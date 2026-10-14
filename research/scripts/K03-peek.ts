// Dump zhwiki extracts for the given names into .probe/K03-tmp.txt.
// Usage: node research/scripts/K03-peek.ts 名字 名字 ... [--len=1500]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const dir = path.join(ROOT, '.probe/K03-wiki')
const args = process.argv.slice(2)
const len = Number(args.find((a) => a.startsWith('--len='))?.slice(6) ?? 1500)
const names = args.filter((a) => !a.startsWith('--'))
const files = fs.readdirSync(dir)
let out = ''
for (const n of names) {
  const f = files.find((x) => x.startsWith(n + '-'))
  const text = f ? fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s+/g, '').slice(0, len) : 'MISSING'
  out += `## ${n} ${text}\n`
}
fs.writeFileSync(path.join(ROOT, '.probe/K03-tmp.txt'), out, 'utf8')
console.log('wrote', names.length)

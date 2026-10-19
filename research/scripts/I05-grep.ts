// Prints each paragraph of sources/text/<id>.txt that matches a pattern, into .probe/I05-grep.txt.
// Usage: node research/scripts/I05-grep.ts <regex> [id-prefix ...]   (no prefix: every source)
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const [pattern, ...prefixes] = process.argv.slice(2)
const re = new RegExp(pattern)
const dir = join(ROOT, 'sources', 'text')
const out: string[] = []
for (const f of readdirSync(dir).sort()) {
  const id = f.replace(/\.txt$/, '')
  if (prefixes.length && !prefixes.some((p) => id.startsWith(p))) continue
  readFileSync(join(dir, f), 'utf8').split('\n').forEach((l, i) => {
    const m = l.match(re)
    if (!m) return
    const at = Math.max(0, (m.index ?? 0) - 150)
    out.push(`${id}:${i + 1}: ${l.slice(at, at + 500)}`)
  })
}
writeFileSync(join(ROOT, '.probe', 'I05-grep.txt'), out.join('\n') + '\n')

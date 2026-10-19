// Finds registered sources whose id, title or url matches a pattern, and whether their text is stored.
//   node research/scripts/A02-src.ts <regex> [<regex> ...]   -> .probe/A02-src.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const res = process.argv.slice(2).map((s) => new RegExp(s, 'i'))
const out: string[] = []
for (const f of readdirSync(join(ROOT, 'research', 'manifests'))) {
  const doc = parse(readFileSync(join(ROOT, 'research', 'manifests', f), 'utf8')) ?? {}
  for (const s of (doc.web ?? []) as { id: string; title: string; url: string; date?: string; excerpt?: boolean }[]) {
    const hay = `${s.id} ${s.title} ${s.url}`
    if (!res.some((r) => r.test(hay))) continue
    const p = join(ROOT, 'sources', 'text', `${s.id}.txt`)
    const len = existsSync(p) ? readFileSync(p, 'utf8').length : 0
    out.push(`${s.id}\t${s.date ?? ''}\t${len}${s.excerpt ? 'x' : ''}\t${s.title}\t${s.url}`)
  }
}
writeFileSync(join(ROOT, '.probe', 'A02-src.txt'), out.sort().join('\n') + '\n')
console.log(out.length)

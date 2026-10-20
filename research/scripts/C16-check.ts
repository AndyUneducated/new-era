// C16: built case summary (outcome, term, years, yuan, steps) for the given ids, read from public/data/*.json
// node research/scripts/C16-check.ts id ...  ->  .probe/c16-check.txt
import { readFileSync, writeFileSync } from 'node:fs'

const ids = new Set(process.argv.slice(2))
const out: string[] = []
const seen = new Set<string>()
function walk(x: unknown, file: string) {
  if (Array.isArray(x)) return x.forEach((v) => walk(v, file))
  if (!x || typeof x !== 'object') return
  const o = x as Record<string, unknown>
  const id = o.id as string | undefined
  if (id && ids.has(id) && !seen.has(id + file)) {
    for (const v of Object.values(o))
      if (v && typeof v === 'object' && 'steps' in v && 'charges' in v) {
        seen.add(id + file)
        out.push(`${file} ${id} status=${o.status} ${JSON.stringify(v).slice(0, 900)}`)
      }
  }
  for (const v of Object.values(o)) walk(v, file)
}
for (const f of ['db.json', 'more.json']) walk(JSON.parse(readFileSync(`public/data/${f}`, 'utf8')), f)
writeFileSync('.probe/c16-check.txt', out.join('\n') + '\n', 'utf8')

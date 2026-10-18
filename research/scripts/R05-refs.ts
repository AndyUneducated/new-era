// Lists the references the zhwiki fall lists give for each R05 row (title, url, archive), and whether the url or a
// Wayback copy of it is already registered in research/manifests/.
//   node research/scripts/R05-refs.ts   -> .probe/R05-refs.txt
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const norm = (u: string) =>
  u
    .replace(/^https?:\/\/web\.archive\.org\/web\/\w+\//, '')
    .replace(/^https?:\/\/(www\.|m\.)?/, '')
    .replace(/_m\.html$/, '.html')
    .replace(/\/+$/, '')
const known = new Map<string, string>()
for (const f of readdirSync(join(ROOT, 'research', 'manifests')).filter((f) => f.endsWith('.yaml')))
  try {
    for (const e of (parse(readFileSync(join(ROOT, 'research', 'manifests', f), 'utf8')) as { web?: { id: string; url: string }[] })?.web ?? [])
      known.set(norm(e.url), e.id)
  } catch {}
const rows = JSON.parse(readFileSync(join(ROOT, '.probe', 'R05-rows.json'), 'utf8')) as { name: string; date: string; refs: { title: string; url: string; archive?: string }[] }[]
const out: string[] = []
for (const r of rows) {
  out.push(`## ${r.date} ${r.name}`)
  for (const x of r.refs) out.push(`  ${known.get(norm(x.url)) ? `[HAVE ${known.get(norm(x.url))}] ` : ''}${x.title}\n    ${x.url}\n    ${x.archive ?? ''}`)
}
writeFileSync(join(ROOT, '.probe', 'R05-refs.txt'), out.join('\n') + '\n')
console.log(rows.length)

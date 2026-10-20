// RL2: append peek-only zh.wikipedia person entries (id rl2-wp-<person>) to research/manifests/RL2.yaml
// for list people still without a relation; skips names whose page is already registered elsewhere.
// Lists the ids in .probe/RL2-wikigen.txt. Remove the block between the markers once peeking is done.
// Run: node research/scripts/RL2-wikigen.ts
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path, read } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const covered = new Set<string>()
for (const f of readdirSync(path('content', 'relations')))
  for (const r of (read('content', 'relations', f) ?? []) as { a: string; b: string }[]) (covered.add(r.a), covered.add(r.b))
const manifests = readdirSync(path('research', 'manifests'))
  .map((f) => readFileSync(path('research', 'manifests', f), 'utf8'))
  .join('\n')
const lines: string[] = []
const ids: string[] = []
for (const [id, name] of rows) {
  if (covered.has(id)) continue
  if (manifests.includes(`zh-hans/${name}"`) || manifests.includes(`wiki/${name}"`) || manifests.includes(`zh-cn/${name}"`)) continue
  const sid = `rl2-wp-${id}`
  ids.push(sid)
  lines.push(`  - { id: ${sid}, title: ${name}（维基百科）, publisher: 维基百科, voice: wiki, url: "https://zh.wikipedia.org/zh-hans/${name}", excerpt: true, keep: [ "→" ] }`)
}
appendFileSync(path('research', 'manifests', 'RL2.yaml'), `  # >>> RL2-wikigen\n${lines.join('\n')}\n  # <<< RL2-wikigen\n`)
writeFileSync(path('.probe', 'RL2-wikigen.txt'), ids.join(' ') + '\n')
console.log(ids.length)

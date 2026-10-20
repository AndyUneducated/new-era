// RL2: look up person ids by name (exact name or alias), and list which of the given ids exist.
// Run: node research/scripts/RL2-ids.ts --batch=RL2 名字1 名字2 id-a id-b ... → .probe/RL2-ids.txt (UTF-8)
import { mkdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const d = loadAll()
const out: string[] = []
for (const q of process.argv.slice(2).filter((a) => !a.startsWith('--'))) {
  const hits = d.people.filter((p) => p.id === q || p.name === q || p.aka.includes(q))
  if (!hits.length) out.push(`${q}\t-`)
  for (const p of hits) out.push(`${q}\t${p.id}\t${p.name}\t${(p as { headline?: string }).headline ?? ''}\t${p.cites.slice(0, 6).join(',')}`)
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL2-ids.txt'), out.join('\n') + '\n')
console.log('ok', out.length)

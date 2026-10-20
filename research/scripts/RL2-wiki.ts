// RL2: for each list person without an RL2 relation, the wiki sources already on file (by title) → .probe/RL2-wiki.txt
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path, read } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const mine = new Set(((read('content', 'relations', 'RL2.yaml') ?? []) as { a: string; b: string }[]).flatMap((r) => [r.a, r.b]))
const wiki: { id: string; title: string; url: string }[] = []
for (const f of readdirSync(path('research', 'manifests')).filter((f) => f.endsWith('.yaml'))) {
  let m: { web?: { id: string; title?: string; url?: string; voice?: string }[] }
  try {
    m = read('research', 'manifests', f) ?? {}
  } catch {
    continue
  }
  for (const s of m.web ?? []) if (s.voice === 'wiki') wiki.push({ id: s.id, title: s.title ?? '', url: s.url ?? '' })
}
const out: string[] = []
for (const [id, name] of rows) {
  if (mine.has(id)) continue
  const hits = wiki.filter((w) => w.title.startsWith(name) || decodeURI(w.url).includes(`/${name}`))
  out.push(`${id}\t${name}\t${hits.map((h) => `${h.id}${existsSync(path('sources', 'text', `${h.id}.txt`)) ? '' : '(no text)'}`).join(' ')}`)
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL2-wiki.txt'), out.join('\n') + '\n')

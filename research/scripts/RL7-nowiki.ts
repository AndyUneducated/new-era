// RL7: list people still without relations whose name has no Wikipedia url in any manifest → .probe/rl7-nowiki.txt
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'
import { loadAll } from '../../tools/build/load.ts'

const list = readFileSync(path('research', 'lists', 'R19-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const d = loadAll()
const related = new Set(d.relations.flatMap((r) => [r.a, r.b]))
const urls = readdirSync(path('research', 'manifests'))
  .filter((f) => f.endsWith('.yaml'))
  .flatMap((f) => [...readFileSync(path('research', 'manifests', f), 'utf8').matchAll(/url:\s*"?([^"\s,}]+)/g)].map((m) => decodeURIComponent(m[1])))
  .filter((u) => u.includes('wikipedia'))
const out = list
  .filter(([id]) => !related.has(id))
  .map(([id, name, roles, head]) => `${urls.some((u) => u.endsWith('/' + name) || u.includes('/' + name + '_') || u.includes('/' + name + '(')) ? 'WIKI' : 'none'}\t${id}\t${name}\t${roles}\t${head}`)
writeFileSync(path('.probe', 'rl7-nowiki.txt'), out.join('\n') + '\n')
console.log('ok', out.filter((l) => l.startsWith('none')).length, 'of', out.length)

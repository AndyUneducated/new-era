// K08: which names already have a card or roster entry (any batch, K07 included). Names from --file= (one per line).
// → .probe/K08-who.txt: name \t ids (card) \t roster batches
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'
import { path } from '../../tools/build/io.ts'

const file = process.argv.find((a) => a.startsWith('--file='))?.slice(7) ?? '.probe/K08-names.txt'
const names = readFileSync(file, 'utf8').split(/[\r\n]+/).map((s) => s.trim()).filter(Boolean)
const card = new Map<string, string[]>()
const add = (m: Map<string, string[]>, k: string, v: string) => m.set(k, [...(m.get(k) ?? []), v])
for (const f of readdirSync(path('content', 'people')).filter((f) => f.endsWith('.yaml'))) {
  let arr: { id: string; name: string; aka?: string[]; headline?: string }[] = []
  try {
    arr = (parse(readFileSync(path('content', 'people', f), 'utf8')) ?? []) as typeof arr
  } catch {
    continue
  }
  for (const p of arr ?? []) for (const n of [p.name, ...(p.aka ?? [])]) if (n) add(card, n, `${p.id}@${f.replace('.yaml', '')}「${(p.headline ?? '').slice(0, 30)}」`)
}
const roster = new Map<string, string[]>()
const rosterFiles = ['roster.yaml', ...readdirSync(path('research', 'roster')).map((f) => `roster/${f}`)]
for (const f of rosterFiles) {
  const t = readFileSync(path('research', ...f.split('/')), 'utf8')
  for (const m of t.matchAll(/id:\s*([\w-]+),\s*name:\s*([^,}]+)/g)) add(roster, m[2].trim(), `${m[1]}@${f}`)
}
const out = names.map((n) => `${n}\t${(card.get(n) ?? []).join(' ; ') || '-'}\t${(roster.get(n) ?? []).join(' ') || '-'}`)
writeFileSync(path('.probe', 'K08-who.txt'), out.join('\n') + '\n')
console.log('ok', names.length)

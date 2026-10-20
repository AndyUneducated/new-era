// RL2: scan text files (default .probe/peek-rl2-*.txt) for list people still without an RL2 relation;
// prints each line naming one, with the other people on file named in it → .probe/RL2-scan.txt
// Needs .probe/RL2-people.txt (research/scripts/RL2-people.ts). Run: node research/scripts/RL2-scan.ts [file ...]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path, read } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const mine = new Set(((read('content', 'relations', 'RL2.yaml') ?? []) as { a: string; b: string }[]).flatMap((r) => [r.a, r.b]))
const people = readFileSync(path('.probe', 'RL2-people.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const nameIds = new Map<string, string[]>()
for (const [id, name, aka] of people) for (const n of [name, ...(aka ? aka.split('/') : [])]) if (n.length >= 2) nameIds.set(n, [...(nameIds.get(n) ?? []), id])
const names = [...nameIds].sort((a, b) => b[0].length - a[0].length)
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const files = args.length ? args : readdirSync(path('.probe')).filter((f) => f.startsWith('peek-rl2-')).map((f) => path('.probe', f))
const out: string[] = []
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split(/\r?\n/)
  const hits: string[] = []
  lines.forEach((l, i) => {
    const flat = l.replace(/(\p{Script=Han}) (\p{Script=Han})/gu, '$1$2')
    for (const [id, name] of rows) {
      if (mine.has(id) || !flat.includes(name)) continue
      let rest = flat.split(name).join('〇')
      const others: string[] = []
      for (const [n, ids] of names) if (rest.includes(n)) { others.push(`${n}(${ids.join('|')})`); rest = rest.split(n).join('〇') }
      hits.push(`  [${i}] ${name}(${id}) with ${others.slice(0, 10).join(' ')} :: ${l.slice(0, 260)}`)
      const near = (step: number) => {
        for (let j = i + step, n = 0; j >= 0 && j < lines.length && n < 2; j += step) {
          const t = lines[j].trim()
          if (!t) continue
          n++
          const flatT = t.replace(/(\p{Script=Han}) (\p{Script=Han})/gu, '$1$2')
          const on = names.filter(([nm]) => flatT.startsWith(nm)).map(([nm, ids]) => `${nm}(${ids.join('|')})`)
          hits.push(`      ${step < 0 ? '↑' : '↓'} ${t.slice(0, 120)}${on.length ? `  ◀ ${on[0]}` : ''}`)
        }
      }
      if (process.argv.includes('--near')) (near(-1), near(1))
    }
  })
  if (hits.length) out.push(`#### ${f.split(/[\\/]/).pop()}`, ...hits)
}
mkdirSync(path('.probe'), { recursive: true })
writeFileSync(path('.probe', 'RL2-scan.txt'), out.join('\n') + '\n')

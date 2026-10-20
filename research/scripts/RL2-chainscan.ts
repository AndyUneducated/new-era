// RL2: find list people (still without a relation) inside navbox chains "A → B → C" of peek files
// (default .probe/peek-rl2-wp-*.txt) and print their chain neighbours, marking those on file → .probe/RL2-chainscan.txt
// Needs .probe/RL2-people.txt. Run: node research/scripts/RL2-chainscan.ts [file ...]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { path } from '../../tools/build/io.ts'

const rows = readFileSync(path('research', 'lists', 'R15-case-people-no-relation.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => l.split('\t'))
const count = readFileSync(path('.probe', 'RL2-count.txt'), 'utf8')
const missing = rows.filter(([id]) => count.includes(`\n  ${id}\t`))
const byName = new Map<string, string[]>()
for (const l of readFileSync(path('.probe', 'RL2-people.txt'), 'utf8').split(/\r?\n/).filter(Boolean)) {
  const [id, name] = l.split('\t')
  byName.set(name, [...(byName.get(name) ?? []), id])
}
const clean = (t: string) =>
  t
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/\s+/g, '')
    .replace(/^.*?(?=\p{Script=Han}{2,4}$)/u, '')
const args = process.argv.slice(2)
const files = args.length ? args : readdirSync(path('.probe')).filter((f) => f.startsWith('peek-rl2-wp-')).map((f) => path('.probe', f))
const out: string[] = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  const ls = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  ls.forEach((l, i) => {
    const m = /^(前任|继任|繼任)[：:]?\s*(.*)$/.exec(l)
    if (!m) return
    const n = clean(m[2] || ls[i + 1] || '')
    if (!byName.has(n)) return
    const ctx = ls.slice(i + (m[2] ? 1 : 2), i + (m[2] ? 3 : 4)).join(' | ')
    out.push(`${f.split(/[\\/]/).pop()}  ${m[1]} ${n}[${byName.get(n)!.join('|')}]  :: ${ctx}  ‖ ${ls.slice(Math.max(0, i - 3), i).join(' | ')}`)
  })
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes('→')) continue
    const toks = line.split('→').map(clean)
    toks.forEach((t, i) => {
      const hit = missing.find(([, name]) => t === name)
      if (!hit) return
      const nb = [toks[i - 1], toks[i + 1]].filter(Boolean).map((n) => `${n}${byName.has(n) ? `[${byName.get(n)!.join('|')}]` : ''}`)
      if (!nb.some((n) => n.includes('['))) return
      out.push(`${f.split(/[\\/]/).pop()}  ${hit[0]}  ${nb.join('  ')}  :: ${line.slice(0, 200)}`)
    })
  }
}
writeFileSync(path('.probe', 'RL2-chainscan.txt'), [...new Set(out)].join('\n') + '\n')
console.log(out.length)

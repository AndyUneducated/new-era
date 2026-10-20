// CS9 one-off: print the opening of each named source text (or the lines matching a pattern) to .probe/cs9-cat.txt
// Usage: node research/scripts/CS9-cat.ts [--grep=regex] [--n=chars] id1 id2 ...
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
const args = process.argv.slice(2)
const re = args.find((a) => a.startsWith('--grep='))?.slice(7)
const n = Number(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 600)
const out: string[] = []
for (const id of args.filter((a) => !a.startsWith('--'))) {
  const f = `sources/text/${id}.txt`
  if (!existsSync(f)) {
    out.push(`## ${id}\nMISSING\n`)
    continue
  }
  const t = readFileSync(f, 'utf8')
  const body = re ? t.split(/\n/).filter((l) => new RegExp(re).test(l)).map((l) => l.slice(0, n)).join('\n') : t.slice(0, n)
  out.push(`## ${id} (${t.length})\n${body}\n`)
}
writeFileSync('.probe/cs9-cat.txt', out.join('\n'))

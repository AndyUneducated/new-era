// R07: for each remaining name, the sources already registered by any batch whose title or keep mentions the name,
// and sources/text files that mention it. Output: .probe/R07-known.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type E = { id: string; title: string; url: string; date?: string; excerpt?: boolean }
const all: (E & { file: string })[] = []
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const e of (parse(readFileSync(`research/manifests/${f}`, 'utf8'))?.web ?? []) as E[]) all.push({ ...e, file: f })
  } catch {}
}
type Row = { name: string; done: boolean }
const names: string[] = []
for (const l of ['R05', 'R06', 'R03'])
  names.push(...((parse(readFileSync(`research/falls-list/${l}.yaml`, 'utf8')) as Row[]).filter((r) => !r.done).map((r) => r.name)))
const out: string[] = []
for (const n of [...new Set(names)]) {
  const hits = all.filter((e) => e.title?.includes(n))
  out.push(`## ${n}`)
  for (const e of hits) out.push(`  ${e.id} [${e.file}] ${e.date ?? ''} ${e.title} ${existsSync(`sources/text/${e.id}.txt`) ? 'TEXT' : 'NOTEXT'}${e.excerpt ? ' EXC' : ''}\n     ${e.url}`)
}
writeFileSync('.probe/R07-known.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length, all.length)

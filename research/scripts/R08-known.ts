// R08: for each name, the sources already registered by any batch whose title mentions it, and how many stored
// texts mention it. Names from argv, or the R08 working list in .probe/R08-names.txt.
//   node research/scripts/R08-known.ts [name ...]   -> .probe/R08-known.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parse } from 'yaml'

type E = { id: string; title: string; url: string; date?: string; excerpt?: boolean; rumor?: boolean }
const all: (E & { file: string })[] = []
for (const f of readdirSync('research/manifests').filter((f) => f.endsWith('.yaml'))) {
  try {
    for (const e of (parse(readFileSync(`research/manifests/${f}`, 'utf8'))?.web ?? []) as E[]) all.push({ ...e, file: f })
  } catch {}
}
let names = process.argv.slice(2)
if (!names.length) names = readFileSync('.probe/R08-names.txt', 'utf8').split(/\s+/).filter(Boolean)
const texts = readdirSync('sources/text').map((t) => [t, readFileSync(`sources/text/${t}`, 'utf8')] as const)
const out: string[] = []
for (const n of names) {
  const hits = all.filter((e) => e.title?.includes(n))
  const inText = texts.filter(([t, s]) => !hits.some((h) => h.id + '.txt' === t) && s.includes(n)).map(([t]) => t)
  out.push(`## ${n}  (other texts mentioning: ${inText.length}${inText.length ? ': ' + inText.slice(0, 12).join(' ') : ''})`)
  for (const e of hits)
    out.push(`  ${e.id} [${e.file}] ${e.date ?? ''} ${e.title} ${existsSync(`sources/text/${e.id}.txt`) ? 'TEXT' : 'NOTEXT'}${e.excerpt ? ' EXC' : ''}${e.rumor ? ' RUMOR' : ''}\n     ${e.url}`)
}
writeFileSync('.probe/R08-known.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length, all.length)

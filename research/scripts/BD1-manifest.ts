// BD1: append zh.wikipedia entries to research/manifests/BD1.yaml, skipping pages any manifest already has
//   node research/scripts/BD1-manifest.ts <tsv>   tsv lines: personId<TAB>page title<TAB>keep1|keep2
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

const file = 'research/manifests/BD1.yaml'
if (!existsSync(file)) writeFileSync(file, '# BD1: sources for birth dates, birthplaces and positions of existing cards\nweb:\n', 'utf8')
const all = readdirSync('research/manifests').map((f) => readFileSync(`research/manifests/${f}`, 'utf8')).join('\n')
const decoded = (() => {
  try {
    return decodeURIComponent(all)
  } catch {
    return all
  }
})()
const rows = readFileSync(process.argv[2], 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
const out: string[] = []
const skipped: string[] = []
for (const r of rows) {
  const [pid, title, keep] = r.split('\t')
  const slug = title.replace(/ /g, '_')
  const id = `bd1-wiki-${pid}`
  const dup = [`/${slug}"`, `/${slug} `, `/${slug}\n`, `/${slug},`, `/${title}"`].some((s) => decoded.includes(s)) || all.includes(`id: ${id}`)
  if (dup) {
    skipped.push(`${pid}\t${title}`)
    continue
  }
  const keeps = keep.split('|').map((k) => JSON.stringify(k)).join(', ')
  out.push(`  - { id: ${id}, title: ${JSON.stringify(`${title}（维基百科）`)}, publisher: 维基百科, voice: wiki, url: ${JSON.stringify(`https://zh.wikipedia.org/zh-cn/${slug}`)}, excerpt: true, keep: [${keeps}] }`)
}
if (out.length) appendFileSync(file, out.join('\n') + '\n', 'utf8')
writeFileSync('.probe/bd1-manifest.txt', `added ${out.length}\n${out.map((l) => l.match(/id: (\S+),/)![1]).join(' ')}\nskipped (already registered):\n${skipped.join('\n')}\n`, 'utf8')

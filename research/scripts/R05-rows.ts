// Parses the zhwiki fall lists dumped by R05-wiki.ts and keeps the rows first announced 2021-01 to 2023-12.
//   node research/scripts/R05-rows.ts   -> .probe/R05-rows.json, .probe/R05-rows.txt
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
type Row = { name: string; target: string; post: string; date: string; status: string; grade: string; refs: { title: string; url: string; archive?: string }[]; page: number }
const rows: Row[] = []
const strip = (s: string) =>
  s
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/　/g, '')
    .trim()

for (const n of [0, 1]) {
  let text = readFileSync(join(ROOT, '.probe', `R05-wiki-${n}.txt`), 'utf8')
  if (n === 1) text = text.slice(text.indexOf('===二十大至二十一大期间查处==='), text.indexOf('==副军级及以上'))
  let grade = ''
  for (const block of text.split(/\n\|-[^\n]*\n/)) {
    const g = block.match(/^!\s*colspan="4"\s*\|\s*(.+)$/m)
    if (g && !block.includes('\n|')) {
      grade = g[1].trim()
      continue
    }
    const cells = block.split(/\n(?=\|)/).map((c) => c.replace(/^\|\s*/, ''))
    if (cells.length < 4) continue
    const date = cells[2].match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (!date) continue
    const iso = `${date[1]}-${date[2].padStart(2, '0')}-${date[3].padStart(2, '0')}`
    if (iso < '2021-01-01' || iso > '2023-12-31') continue
    const link = cells[0].match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/)
    const all = cells.join('\n')
    const refs = [...all.matchAll(/\{\{[Cc]ite[^}]*\}\}/g)].map((m) => {
      const f = (k: string) => m[0].match(new RegExp(`\\|\\s*${k}\\s*=\\s*([^|}]+)`))?.[1].trim()
      return { title: f('title') ?? '', url: f('url') ?? '', archive: f('archive-?url') }
    })
    rows.push({ name: strip(cells[0]), target: link?.[1] ?? '', post: strip(cells[1]), date: iso, status: strip(cells[3]), grade, refs, page: n })
  }
}
rows.sort((a, b) => a.date.localeCompare(b.date))
writeFileSync(join(ROOT, '.probe', 'R05-rows.json'), JSON.stringify(rows, null, 1))
writeFileSync(
  join(ROOT, '.probe', 'R05-rows.txt'),
  rows.map((r, i) => `${i + 1}\t${r.date}\t${r.grade}\t${r.name}\t[${r.target}]\t${r.post}\t${r.status}`).join('\n') + '\n',
)
console.log(rows.length, 'rows')

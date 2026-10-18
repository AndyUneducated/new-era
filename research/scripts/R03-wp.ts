// R03 one-off: pull the zh.wikipedia lists of officials investigated after the 18th congress (a finding aid only;
// every fall on a card is cited to CCDI / Xinhua) and print the rows whose first date is in 2016 or 2017.
//   node research/scripts/R03-wp.ts   writes .probe/R03-wp-<n>.txt and .probe/R03-wp-rows.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const TITLES = ['中共十八大至十九大期间落马官员列表', '中共十九大以来落马官员列表', '中共十八大后落马官员列表', '中共十九大至二十大期间落马官员列表']
const out: string[] = []
const clean = (s: string) =>
  s
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[\s\S]*?<\/ref>/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<\/?span[^>]*>/g, '')
    .trim()
for (const [i, title] of TITLES.entries()) {
  const file = join(ROOT, '.probe', `R03-wp-${i}.txt`)
  if (!existsSync(file)) {
    const u = `https://zh.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&variant=zh-cn&page=${encodeURIComponent(title)}`
    const j = await (await fetch(u, { headers: { 'User-Agent': UA } })).json()
    writeFileSync(file, j.parse?.wikitext?.['*'] ?? `MISSING ${JSON.stringify(j.error ?? {})}`)
  }
  const text = readFileSync(file, 'utf8')
  out.push(`# ${title} (${text.length} chars)`)
  let section = ''
  for (const r of text.split(/\n\|-/)) {
    const h = r.match(/\n==+\s*([^=]+?)\s*==+/g)
    const cells = r.split(/\n\|/).map((c) => c.trim())
    const dateCell = cells.find((c) => /^(201[67])年\d+月\d+日/.test(clean(c)))
    if (dateCell) {
      const urls = [...r.matchAll(/url=(http[^|}\s]+)/g)].map((m) => m[1]).filter((u) => !u.includes('archive'))
      const titles = [...r.matchAll(/title=([^|}]+)/g)].map((m) => m[1])
      out.push(`[${section}] ` + cells.map(clean).filter(Boolean).join(' ¦ '))
      titles.forEach((t, k) => out.push(`    - ${t} :: ${urls[k] ?? ''}`))
    }
    if (h) section = h[h.length - 1].replace(/=/g, '').trim()
  }
}
writeFileSync(join(ROOT, '.probe', 'R03-wp-rows.txt'), out.join('\n') + '\n')
console.log(`${out.length} lines`)

// R02 one-off: pull the zh.wikipedia list of officials investigated after the 18th congress (a finding aid only;
// every fall on a card is cited to CCDI / Xinhua) and print the rows that mention 2015.
//   node research/scripts/R02-wp.ts   writes .probe/R02-wp-<n>.txt and .probe/R02-wp-2015.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const TITLES = ['中共十八大至十九大期间落马官员列表', '中共十八大后落马官员列表']
const out: string[] = []
for (const [i, title] of TITLES.entries()) {
  const file = join(ROOT, '.probe', `R02-wp-${i}.txt`)
  if (!existsSync(file)) {
    const u = `https://zh.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&variant=zh-cn&page=${encodeURIComponent(title)}`
    const j = await (await fetch(u, { headers: { 'User-Agent': UA } })).json()
    writeFileSync(file, j.parse?.wikitext?.['*'] ?? `MISSING ${JSON.stringify(j.error ?? {})}`)
  }
  const text = readFileSync(file, 'utf8')
  out.push(`# ${title} (${text.length} chars)`)
  const rows = text.split(/\n\|-/)
  for (const r of rows) if (/2015年/.test(r)) out.push(r.replace(/\n/g, ' ¦ ').slice(0, 600))
}
writeFileSync(join(ROOT, '.probe', 'R02-wp-2015.txt'), out.join('\n') + '\n')
console.log(`${out.length} lines`)

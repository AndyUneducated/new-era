// K04: screen the roster for falls against the zh.wikipedia lists of investigated officials (a finding aid
// only; every fall on a card is cited to CCDI / Xinhua). Writes .probe/K04-falls.txt.
//   node research/scripts/K04-falls.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const TITLES = [
  '中共十八大后落马官员列表',
  '中共十九大至二十大期间落马官员列表',
  '中共二十大后落马官员列表',
  '中共十八大后落马的副军级及以上解放军军官和武警警官',
  '中华人民共和国腐败案件列表',
  '中共十八大至十九大期间落马官员列表',
  '中共十七大至十八大期间落马官员列表',
]
const names = readFileSync(join(ROOT, '.probe', 'K04-names.txt'), 'utf8').trim().split(/\s+/)
const out: string[] = []
for (const [i, title] of TITLES.entries()) {
  const file = join(ROOT, '.probe', `K04-wp-${i}.txt`)
  if (!existsSync(file)) {
    const u = `https://zh.wikipedia.org/w/api.php?action=parse&format=json&prop=wikitext&redirects=1&variant=zh-cn&page=${encodeURIComponent(title)}`
    const j = await (await fetch(u, { headers: { 'User-Agent': UA } })).json()
    writeFileSync(file, j.parse?.wikitext?.['*'] ?? `MISSING ${JSON.stringify(j.error ?? {})}`)
  }
  const text = readFileSync(file, 'utf8')
  out.push(`# ${title} (${text.length} chars)`)
  const lines = text.split('\n')
  for (const name of names) {
    const re = new RegExp(`\\[\\[${name}( \\(|\\]\\]|\\|)|\\|\\s*${name}\\s*(\\||$)|[^\\p{Script=Han}]${name}[^\\p{Script=Han}]|${[...name].join('　')}`, 'u')
    lines.forEach((l, k) => {
      if (re.test(l)) out.push(`${name}\t${k}\t${[lines[k - 1], l, lines[k + 1], lines[k + 2]].join(' ¦ ').slice(0, 400)}`)
    })
  }
}
writeFileSync(join(ROOT, '.probe', 'K04-falls.txt'), out.join('\n') + '\n')
console.log(`${out.length} lines`)

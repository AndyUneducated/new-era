// K05: a compact career timeline per person from the archived Wikipedia text: every "YYYY年M月 … 任某职"
// fragment, for writing the positions by hand.
//   node research/scripts/K05-career.ts   -> .probe/K05-career.txt
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PEOPLE } from './K05-ids.ts'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const reuse = JSON.parse(readFileSync(join(ROOT, '.probe', 'K05-reuse.json'), 'utf8')) as Record<string, string>
const RX = /(\d{4})年(?:(\d{1,2})月)?(?:\d{1,2}日)?[^。；]{0,12}?(?:任|升任|出任|调任|转任|当选|兼任|晋升|接替)([^。；]{2,46})/g
const out: string[] = []
for (const [raw, id] of PEOPLE) {
  const src = reuse[id] && existsSync(join(ROOT, 'sources', 'text', `${reuse[id]}.txt`)) ? reuse[id] : `k05-wiki-${id}`
  const f = join(ROOT, 'sources', 'text', `${src}.txt`)
  if (!existsSync(f)) {
    out.push(`## ${raw} ${id} (no text)`)
    continue
  }
  const text = readFileSync(f, 'utf8').replace(/\[\d+\]/g, '').replace(/\n+/g, ' ')
  const items: string[] = []
  for (const m of text.matchAll(RX)) {
    const s = `${m[1]}${m[2] ? '-' + m[2].padStart(2, '0') : ''} ${m[3].replace(/\s+/g, '')}`
    if (!items.includes(s)) items.push(s)
  }
  out.push(`## ${raw} ${id} [${src}]`, '  ' + items.slice(0, 22).join(' / '))
}
writeFileSync(join(ROOT, '.probe', 'K05-career.txt'), out.join('\n') + '\n', 'utf8')
console.log(out.length)

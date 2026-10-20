// Compact view of a PH10-bing output: numbers every lead (block.k) and keeps only size, page host and title, so
// that a whole run can be read at once; PH10-pick.ts turns the numbers back into picture and page URLs.
//   node research/scripts/PH10-short.ts .probe/PH10-bing-q1.txt   → .probe/PH10-bing-q1.short.txt
import { readFileSync, writeFileSync } from 'node:fs'

const src = process.argv[2]
const lines: string[] = []
let b = 0
let k = 0
for (const l of readFileSync(src, 'utf8').split('\n')) {
  if (l.startsWith('== ')) {
    b++
    k = 0
    lines.push(`${b} ${l}`)
  } else if (l.includes('\t')) {
    const [, page, size, title] = l.split('\t')
    let host = ''
    try {
      host = new URL(page).host.replace(/^www\./, '')
    } catch {}
    lines.push(`  ${b}.${++k} ${size} ${host} ${title.slice(0, 70)}`)
  }
}
writeFileSync(src.replace(/\.txt$/, '.short.txt'), lines.join('\n'))
console.log('done')

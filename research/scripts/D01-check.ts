// D01 one-off: check the charter / constitution texts are clean — article numbering continuous, paragraph layout, stray short lines.
// Writes .probe/D01-check.txt. Usage: node research/scripts/D01-check.ts [id ...]
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      'd01-people-2002-11-18-party-charter',
      'd01-people-2007-10-25-party-charter',
      'd01-neac-2012-11-19-party-charter',
      'd01-12371-2017-10-28-party-charter',
      'i01-12371-2022-10-22-party-charter',
      'd01-pkulaw-1999-03-15-constitution',
      'd01-npc-2004-03-14-constitution',
      'i01-gov-2018-03-11-constitution',
    ]

const DIGIT: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
function cn(s: string): number {
  let total = 0
  let cur = 0
  for (const ch of s) {
    if (ch in DIGIT) cur = DIGIT[ch]
    else if (ch === '十') (total += (cur || 1) * 10), (cur = 0)
    else if (ch === '百') (total += (cur || 1) * 100), (cur = 0)
  }
  return total + cur
}

const out: string[] = []
for (const id of ids) {
  const raw = readFileSync(join(ROOT, 'sources', 'text', `${id}.txt`), 'utf8')
  const paras = raw.replace(/\n$/, '').split('\n\n')
  const layout = [
    raw.endsWith('\n') && !raw.endsWith('\n\n') ? '' : 'BAD-END',
    /\n\n\n/.test(raw) ? 'TRIPLE-NEWLINE' : '',
    paras.some((p) => p.includes('\n')) ? 'SINGLE-NEWLINE-INSIDE' : '',
    paras.some((p) => p !== p.trim() || !p) ? 'EMPTY-OR-UNTRIMMED' : '',
  ].filter(Boolean)
  const arts = paras.map((p) => p.match(/^第([零〇一二三四五六七八九十百]+)条/)?.[1]).filter((x): x is string => !!x).map(cn)
  const gaps: string[] = []
  arts.forEach((n, i) => {
    if (n !== i + 1) gaps.push(`#${i + 1}=${n}`)
  })
  const chapters = paras.filter((p) => /^第[一二三四五六七八九十]+章/.test(p) && p.length < 30)
  const short = paras.filter((p) => p.length <= 24 && !/^第[一二三四五六七八九十百零]+[章节条]/.test(p) && !/^（[一二三四五六七八九十]+）/.test(p))
  const chars = raw.replace(/\s/g, '').length
  const spaced = paras
    .slice(1)
    .map((p) => p.replace(/^第[零〇一二三四五六七八九十百]+[章节条] /, ''))
    .filter((p) => / /.test(p) && p.length > 12)
  out.push(
    `== ${id}`,
    `paragraphs ${paras.length}  chars(no whitespace) ${chars}  articles ${arts.length} (last ${arts.at(-1)})  ${gaps.length ? 'GAPS ' + gaps.slice(0, 8).join(' ') : 'numbering ok'}`,
    `layout ${layout.length ? layout.join(' ') : 'ok'}`,
    `chapters ${chapters.length}: ${chapters.join(' | ')}`,
    `short non-article paragraphs: ${short.map((s) => JSON.stringify(s)).join(' ')}`,
    `stray spaces: ${spaced.map((p) => JSON.stringify(p.slice(Math.max(0, p.indexOf(' ') - 10), p.indexOf(' ') + 10))).join(' ')}`,
    `first: ${paras[0].slice(0, 60)}`,
    `last: ${paras.at(-1)!.slice(-60)}`,
    '',
  )
}
writeFileSync(join(ROOT, '.probe', 'D01-check.txt'), out.join('\n'))

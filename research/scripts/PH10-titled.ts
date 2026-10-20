// Contact sheet of the search leads whose page title names the person (the first word of the query), previewed
// through the search engine's cached copy. Labels are <id>:<block>.<k> so that the lead can be found again with
// PH10-pick.ts.
//   node research/scripts/PH10-titled.ts <bing file> <id TAB query file> --tag=x [--max=4] id…
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const [src, qfile, ...rest] = args.filter((a) => !a.startsWith('--'))
const max = Number(args.find((a) => a.startsWith('--max='))?.slice(6) ?? 4)
const ids = readFileSync(qfile, 'utf8').split('\n').filter((l) => l.includes('\t')).map((l) => l.split('\t')[0])
const blocks: { name: string; rows: string[] }[] = []
for (const l of readFileSync(src, 'utf8').split('\n')) {
  if (l.startsWith('== ')) blocks.push({ name: l.slice(3).split(' ')[0], rows: [] })
  else if (l.includes('\t')) blocks.at(-1)!.rows.push(l)
}
const picks: string[] = []
for (const id of rest) {
  const b = ids.indexOf(id)
  if (b < 0 || !blocks[b]) continue
  let k = 0
  blocks[b].rows.forEach((r, i) => {
    const [img, , , title, thumb] = r.split('\t')
    if (k < max && title?.includes(blocks[b].name) && (thumb || img)) {
      picks.push(`${id}:${b + 1}.${i + 1}=${thumb || img}`)
      k++
    }
  })
}
execFileSync('node', ['research/scripts/PH10-cand.ts', ...args.filter((a) => a.startsWith('--tag=')), ...picks], { stdio: 'inherit' })

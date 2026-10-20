// Turns lead numbers from a PH10-short view back into contact-sheet arguments and runs PH10-cand.ts on them.
//   node research/scripts/PH10-pick.ts .probe/PH10-bing-q1.txt [--tag=x] [--big] [--thumb] 3.1 3.4 7.2 …
//   node research/scripts/PH10-pick.ts .probe/PH10-bing-q1.txt --pages 3.1 3.4 …   pictures and captions of their pages
//     that mention the person (the first word of the search), via PH10-imgs.ts
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const src = args[0]
const blocks: { name: string; rows: string[] }[] = []
for (const l of readFileSync(src, 'utf8').split('\n')) {
  if (l.startsWith('== ')) blocks.push({ name: l.slice(3).split(' ')[0], rows: [] })
  else if (l.includes('\t')) blocks.at(-1)!.rows.push(l)
}
const leads = args.slice(1).filter((a) => /^\d+\.\d+$/.test(a)).map((a) => {
  const [b, k] = a.split('.').map(Number)
  const [img, page, , , thumb] = blocks[b - 1].rows[k - 1].split('\t')
  return { a, img, page, thumb, name: blocks[b - 1].name }
})
if (args.includes('--pages')) {
  execFileSync('node', ['research/scripts/PH10-imgs.ts', ...leads.map((l) => `${l.page}@@${l.name}`)], { stdio: 'inherit' })
  process.exit(0)
}
// the search engine's cached copy previews pictures whose host refuses hot-linking
const picks = leads.map((l) => (l.thumb && args.includes('--thumb') ? `${l.a}=${l.thumb}` : `${l.a}=${l.img}|${l.page}`))
execFileSync('node', ['research/scripts/PH10-cand.ts', ...args.slice(1).filter((a) => a.startsWith('--') && a !== '--thumb'), ...picks], { stdio: 'inherit' })

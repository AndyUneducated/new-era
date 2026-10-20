// Contact sheet of the caption-matched leads in .probe/PH10-auto-<tag>.txt files (id TAB img TAB page TAB caption),
// labelled <id>.<k>; the leads are also listed with their labels in .probe/PH10-autosheet-<tag>.txt.
//   node research/scripts/PH10-autosheet.ts --tag=x [--max=6] <auto file>… -- id…
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const tag = args.find((a) => a.startsWith('--tag='))?.slice(6) ?? 'a'
const max = Number(args.find((a) => a.startsWith('--max='))?.slice(6) ?? 6)
const plain = args.filter((a) => !a.startsWith('--') || a === '--')
const cut = plain.indexOf('--')
const files = plain.slice(0, cut)
const ids = plain.slice(cut + 1)
const rows = files.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter((l) => l.includes('\t')))
const picks: string[] = []
const list: string[] = []
for (const id of ids) {
  const seen = new Set<string>()
  let k = 0
  for (const r of rows) {
    const [rid, img, page, cap] = r.split('\t')
    if (rid !== id || seen.has(img) || k >= max) continue
    seen.add(img)
    k++
    picks.push(`${id}.${k}=${img}|${page}`)
    list.push(`${id}.${k}\t${img}\t${page}\t${cap}`)
  }
}
writeFileSync(`.probe/PH10-autosheet-${tag}.txt`, list.join('\n') + '\n')
execFileSync('node', ['research/scripts/PH10-cand.ts', `--tag=${tag}`, ...picks], { stdio: 'inherit' })

// Look up Wayback snapshots (CDX, status 200) for the T01 per-person URLs: node research/scripts/T01-wb.ts [--skip=id,id] [id ...]
// Appends to .probe/T01-wb.txt: id <tab> original url <tab> timestamp <tab> archived original (or NONE / ERR).
import fs from 'node:fs'
import { parse } from 'yaml'

const man = parse(fs.readFileSync('research/manifests/T01.yaml', 'utf8'))
const args = process.argv.slice(2)
const skip = (args.find((a) => a.startsWith('--skip='))?.slice(7) ?? '').split(',')
const want = args.filter((a) => !a.startsWith('--'))
const list: any[] = man.web.filter((s: any) =>
  (want.length ? want.includes(s.id) : !/^t01-(ccdi-(zjsc|jlsc|djcf)|people-)/.test(s.id)) && !skip.includes(s.id))
const done = new Set(
  fs.existsSync('.probe/T01-wb.txt')
    ? fs.readFileSync('.probe/T01-wb.txt', 'utf8').split('\n').filter((l) => l && !/\tERR/.test(l)).map((l) => l.split('\t')[0])
    : [],
)
for (const s of list) {
  if (done.has(s.id)) continue
  const orig = String(s.url).replace(/^https:\/\/web\.archive\.org\/web\/[^/]+\//, '')
  const key = orig.replace(/^https?:\/\//, '')
  let row = 'ERR'
  for (let i = 0; i < 3 && row === 'ERR'; i++) {
    try {
      const r = await fetch(
        'https://web.archive.org/cdx/search/cdx?url=' + encodeURIComponent(key) + '&output=json&filter=statuscode:200&limit=3',
        { signal: AbortSignal.timeout(60000) },
      )
      const j: any = r.status === 200 ? await r.json() : null
      if (j) row = j.length > 1 ? j[1][1] + '\t' + j[1][2] : 'NONE'
    } catch {}
    if (row === 'ERR') await new Promise((r) => setTimeout(r, 8000))
  }
  fs.appendFileSync('.probe/T01-wb.txt', [s.id, orig, row].join('\t') + '\n', 'utf8')
  await new Promise((r) => setTimeout(r, 3000))
}
console.log('done')

// Commons files whose title contains the Chinese name (or the pinyin) of each rank0–3 person on
// research/lists/R16-photo-next.txt: writes .probe/PH10-ctitle.txt (id, name, then title and size per hit).
//   node research/scripts/PH10-ctitle.ts [id …]
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

const UA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const out = '.probe/PH10-ctitle.txt'
writeFileSync(out, '')
const only = new Set(process.argv.slice(2))
const rows = readFileSync('research/lists/R16-photo-next.txt', 'utf8')
  .split('\n')
  .filter((l) => /^rank[0-3]\t/.test(l))
  .map((l) => l.split('\t'))
  .filter((c) => !only.size || only.has(c[1]))
const pinyin = (id: string) =>
  id
    .split('-')
    .filter((w) => !['pla', 'cr', 'jx', 'pbc', 'citic', 'huaan', 'hunan', 'pastor'].includes(w))
    .map((w) => w[0].toUpperCase() + w.slice(1))
const api = async (params: Record<string, string>) =>
  (await (await fetch(`https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`, { headers: { 'User-Agent': UA } })).json()) as any
for (const [, id, name] of rows) {
  const py = pinyin(id)
  const queries = [`intitle:"${name}"`, `intitle:"${py.join(' ')}"`, ...(py.length === 2 ? [`intitle:"${py[1]} ${py[0]}"`] : [])]
  const hits = new Map<string, string>()
  for (const q of queries) {
    try {
      const r = await api({ action: 'query', list: 'search', srnamespace: '6', srlimit: '15', srsearch: q })
      for (const s of r.query.search) if (!/\.(pdf|djvu|svg|ogg|mp3|webm|ogv)$/i.test(s.title)) hits.set(s.title, `${s.size}`)
    } catch {}
  }
  appendFileSync(out, `== ${id} ${name}\n${[...hits.keys()].join('\n')}\n`)
}
console.log('done')

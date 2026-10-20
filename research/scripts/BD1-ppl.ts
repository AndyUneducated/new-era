// BD1: people.cn site search for birth dates of people still missing born; reads .probe/bd1-left.txt
//   node research/scripts/BD1-ppl.ts <out-suffix> <delay-s> [id ...]           -> .probe/bd1-ppl-<suffix>.txt
//   node research/scripts/BD1-ppl.ts <out-suffix> <delay-s> --born [skip-id ...]
//   node research/scripts/BD1-ppl.ts <out-suffix> <delay-s> --q "id|名字|查询词" ...
// Per article whose text has the name near a birth date: url, date, title, snippet.
import { readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const [suffix, delay, ...rest] = process.argv.slice(2)
const raw = readFileSync('.probe/bd1-left.txt', 'utf8')
const rows = raw.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.replace(/\r$/, '').split('\t'))
const byId = new Map(rows.map((r) => [r[0], r]))
const bornIds = raw.split('# no positions')[0].split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t')[0])

const jobs: { id: string; name: string; q: string }[] = []
if (rest[0] === '--q') for (const s of rest.slice(1)) { const [id, name, q] = s.split('|'); jobs.push({ id, name, q }) }
else {
  const skip = new Set(rest.slice(1))
  const ids = rest[0] === '--born' ? bornIds.filter((id) => !skip.has(id)) : rest
  for (const id of ids) {
    const r = byId.get(id)
    if (r) jobs.push({ id, name: r[1], q: r[1] })
  }
}
const clean = (t: string) => String(t ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;|\s+/g, ' ')
const out: string[] = []
for (const j of jobs) {
  const re = new RegExp(`${j.name}[，,]?(男|女)?[^。]{0,30}?(19[2-9]\\d|200\\d)年(\\d{1,2}月)?(\\d{1,2}日)?(出)?生[^。]{0,60}`)
  out.push(`## ${j.id}\t${j.name}\t${j.q}`)
  let n = 0
  for (const page of [1, 2, 3, 4, 5]) {
    let recs: any[] = []
    try {
      const r = await fetch('http://search.people.cn/search-platform/front/search', {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Referer: 'http://search.people.cn/' },
        body: JSON.stringify({ key: j.q, page, limit: 20, hasTitle: true, hasContent: true, isFuzzy: false, type: 0, sortType: 0, startTime: 0, endTime: 0 }),
        signal: AbortSignal.timeout(25000),
      })
      recs = (await r.json())?.data?.records ?? []
    } catch {
      out.push('   ERR')
    }
    for (const rec of recs) {
      const text = clean(rec.contentOriginal ?? rec.content)
      const m = text.match(re)
      if (!m) continue
      const date = rec.displayTime ? new Date(rec.displayTime).toISOString().slice(0, 10) : rec.inputTime ?? ''
      out.push(`   ${rec.url}\t${date}\t${clean(rec.title).slice(0, 50)}\n      ${m[0].slice(0, 140)}`)
      if (++n >= 4) break
    }
    if (n >= 4 || recs.length < 20) break
  }
  writeFileSync(`.probe/bd1-ppl-${suffix}.txt`, out.join('\n') + '\n', 'utf8')
  await new Promise((s) => setTimeout(s, Number(delay) * 1000))
}
writeFileSync(`.probe/bd1-ppl-${suffix}.txt`, out.join('\n') + '\n## DONE\n', 'utf8')

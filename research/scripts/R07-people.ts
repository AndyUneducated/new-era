// R07 finding aid: people.cn site search (titles, dates, URLs) for the notices about each name, since People's
// Daily Online reprints the CCDI notices and court verdicts.
//   node research/scripts/R07-people.ts name ...   -> .probe/R07-people.txt
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const RE = /审查调查|监察调查|开除|一审|宣判|判处|开庭|公诉/
const out: string[] = []
for (const name of process.argv.slice(2)) {
  out.push(`## ${name}`)
  for (const page of [1, 2]) {
    try {
      const r = await fetch('http://search.people.cn/search-platform/front/search', {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Referer: 'http://search.people.cn/' },
        body: JSON.stringify({ key: name, page, limit: 50, hasTitle: true, hasContent: false, isFuzzy: false, type: 0, sortType: 2, startTime: 0, endTime: 0 }),
        signal: AbortSignal.timeout(30_000),
      })
      const j = await r.json()
      const recs = (j.data?.records ?? []) as { title: string; url: string; displayTime: number }[]
      if (page === 1) out.push(`  [${r.status} total ${j.data?.total ?? '?'}]`)
      for (const x of recs) {
        const t = x.title.replace(/<[^>]+>/g, '')
        if (!t.includes(name) || !RE.test(t)) continue
        out.push(`  ${new Date(x.displayTime).toISOString().slice(0, 10)} ${t}\n      ${x.url}`)
      }
      if (recs.length < 50) break
    } catch (e) {
      out.push(`  FAIL ${(e as Error).message}`)
      break
    }
    await new Promise((r) => setTimeout(r, 800))
  }
}
writeFileSync('.probe/R07-people.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

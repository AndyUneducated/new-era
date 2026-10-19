// R08 finding aid: one source row per step (probe / expel / trial / verdict) for each person, from the people.cn
// site search (People's Daily Online reprints the CCDI notices and court verdicts), falling back to the wiki-ref
// rows in .probe/R08-rows.txt; the wiki row is taken from there too.
//   node research/scripts/R08-pick.ts who=name[=page[=keyword]] ...   -> .probe/R08-pick.txt (rows for R08-src.txt)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const kindOf = (t: string) =>
  /公诉|逮捕|罢免|拥护|撤销|代表资格|一图|视频|评|：/.test(t)
    ? ''
    : /宣判|被判|判处|获刑/.test(t)
      ? 'verdict'
      : /开庭/.test(t)
        ? 'trial'
        : /开除/.test(t)
          ? 'expel'
          : /审查调查|监察调查/.test(t)
            ? 'probe'
            : ''
const rank = (u: string) =>
  [/society\.people/, /fanfu\.people/, /politics\.people/, /cpc\.people/, /legal\.people/, /people\.com\.cn\/n1/, /people\.com\.cn\/n2/].findIndex((re) =>
    re.test(u),
  ) + 1 || 9
const urlDate = (u: string) => {
  const m = u.match(/\/n[12]\/(20\d\d)\/(\d\d)(\d\d)\//)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}
const fallback = existsSync('.probe/R08-rows.txt') ? readFileSync('.probe/R08-rows.txt', 'utf8').split('\n') : []

const out: string[] = []
for (const arg of process.argv.slice(2)) {
  const [who, name, , kw] = arg.split('=')
  out.push(`# ===== ${who} ${name}${kw ? ' [' + kw + ']' : ''}`)
  const wiki = fallback.find((l) => l.startsWith(`${who}|wiki|`))
  if (wiki) out.push(wiki)
  const hits: { kind: string; date: string; title: string; url: string }[] = []
  for (const page of [1, 2, 3]) {
    try {
      const r = await fetch('http://search.people.cn/search-platform/front/search', {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/json', Referer: 'http://search.people.cn/' },
        body: JSON.stringify({ key: name, page, limit: 50, hasTitle: true, hasContent: false, isFuzzy: false, type: 0, sortType: 2, startTime: 0, endTime: 0 }),
        signal: AbortSignal.timeout(30_000),
      })
      const recs = ((await r.json()).data?.records ?? []) as { title: string; url: string }[]
      for (const x of recs) {
        const t = x.title.replace(/<[^>]+>/g, '').trim()
        const k = kindOf(t)
        if (!k || !t.includes(name) || (kw && !t.includes(kw)) || !urlDate(x.url)) continue
        hits.push({ kind: k, date: urlDate(x.url), title: t, url: x.url })
      }
      if (recs.length < 50) break
    } catch (e) {
      out.push(`# FAIL ${(e as Error).message}`)
      break
    }
    await new Promise((r) => setTimeout(r, 600))
  }
  for (const k of ['probe', 'expel', 'trial', 'verdict']) {
    const hs = hits.filter((h) => h.kind === k).sort((a, b) => a.date.localeCompare(b.date) || rank(a.url) - rank(b.url))
    // the earliest day's reprint, best host first
    const best = hs.filter((h) => h.date === hs[0]?.date).sort((a, b) => rank(a.url) - rank(b.url))[0]
    if (best) {
      out.push(`${who}|${k}|${best.date}|${best.url}|${best.title}`)
      for (const h of hs.filter((h) => h !== best).slice(0, 2)) out.push(`# ALT ${who}|${k}|${h.date}|${h.url}|${h.title}`)
      continue
    }
    const fb = fallback.find((l) => l.startsWith(`${who}|${k}|`))
    if (fb) out.push(fb + '   # wiki-ref')
    else if (k !== 'trial') out.push(`# NEED ${who} ${k}`)
  }
}
writeFileSync('.probe/R08-pick.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

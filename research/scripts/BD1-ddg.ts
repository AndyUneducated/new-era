// BD1: DuckDuckGo (html) lookup of birth dates for people still missing born; reads .probe/bd1-left.txt
//   node research/scripts/BD1-ddg.ts <out-suffix> [id ...]          -> .probe/bd1-ddg-<suffix>.txt
//   node research/scripts/BD1-ddg.ts <out-suffix> --q "查询词" ...    (free queries)
import { readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const [suffix, ...rest] = process.argv.slice(2)
const left = readFileSync('.probe/bd1-left.txt', 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'))
const byId = new Map(left.map((r) => [r[0], r]))
const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()

async function ddg(q: string) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch('https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(25000) })
      const t = await r.text()
      const res: { title: string; url: string; snip: string }[] = []
      for (const m of t.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)) {
        let url = m[1]
        const u = url.match(/uddg=([^&]+)/)
        if (u) url = decodeURIComponent(u[1])
        res.push({ title: strip(m[2]), url, snip: strip(m[3]) })
      }
      if (res.length || r.status === 200) return res
    } catch {}
    await new Promise((s) => setTimeout(s, 3000))
  }
  return []
}

const jobs: { id: string; name: string; q: string }[] = []
if (rest[0] === '--q') for (const q of rest.slice(1)) jobs.push({ id: '-', name: q.split(' ')[0], q })
else {
  const bornSection = readFileSync('.probe/bd1-left.txt', 'utf8').split('# no positions')[0].split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t')[0])
  const skip = new Set(rest.slice(1))
  const ids = rest[0] === '--born' ? bornSection.filter((id) => !skip.has(id)) : rest.length ? rest : left.map((r) => r[0])
  for (const id of ids) {
    const r = byId.get(id)
    if (!r) continue
    const org = (r[4] ?? '').split(/[，,；]/)[0].replace(/原/g, '').slice(0, 14)
    jobs.push({ id, name: r[1], q: `${r[1]} ${org} 出生` })
  }
}
const out: string[] = []
for (const j of jobs) {
  let res = await ddg(j.q)
  for (let w = 0; !res.length && w < 2; w++) {
    await new Promise((s) => setTimeout(s, 45000))
    res = await ddg(j.q)
  }
  out.push(`## ${j.id}\t${j.q}\t(${res.length})`)
  for (const x of res) {
    if (!x.snip.includes(j.name) && !x.title.includes(j.name)) continue
    const yr = /(19[2-9]\d|20[01]\d)年(\d{1,2}月)?/.test(x.snip) || /\d{2}岁/.test(x.snip)
    out.push(`  ${yr ? 'Y' : ' '} ${x.url}\n      ${x.title} | ${x.snip.slice(0, 260)}`)
  }
  writeFileSync(`.probe/bd1-ddg-${suffix}.txt`, out.join('\n') + '\n', 'utf8')
  await new Promise((s) => setTimeout(s, 8000))
}
writeFileSync(`.probe/bd1-ddg-${suffix}.txt`, out.join('\n') + '\n## DONE\n', 'utf8')

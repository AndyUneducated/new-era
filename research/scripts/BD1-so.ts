// BD1: 360 mobile search (m.so.com) for birth dates of people still missing born; reads .probe/bd1-left.txt
//   node research/scripts/BD1-so.ts <out-suffix> <delay-s> [id ...]           -> .probe/bd1-so-<suffix>.txt
//   node research/scripts/BD1-so.ts <out-suffix> <delay-s> --born [skip-id ...]
//   node research/scripts/BD1-so.ts <out-suffix> <delay-s> --q "id|名字|查询词" ...
// Per result with a birth-date snippet: real URL (data-pcurl), site, time, snippet.
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
    if (!r) continue
    const org = (r[4] ?? '').split(/[，,；]/)[0].replace(/原/g, '').slice(0, 14)
    jobs.push({ id, name: r[1], q: `${r[1]} ${org} 出生` })
  }
}
const clean = (t: string) =>
  t.replace(/<[^>]+>/g, '').replace(/&nbsp;|&ensp;|&#0183;|&amp;|&quot;/g, ' ').replace(/\s+/g, ' ')
const out: string[] = []
for (const j of jobs) {
  let html = ''
  let blocked = true
  for (let tries = 0; tries < 3 && blocked; tries++) {
    if (tries) await new Promise((s) => setTimeout(s, 240000))
    try {
      const r = await fetch('https://m.so.com/s?q=' + encodeURIComponent(j.q), { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(25000) })
      html = await r.text()
    } catch {}
    blocked = html.length < 20000 || /验证码|antispider/.test(html.slice(0, 5000))
  }
  out.push(`## ${j.id}\t${j.name}\t${j.q}\t${blocked ? 'BLOCKED' : ''}`)
  const re = new RegExp(`${j.name}[^。]{0,60}?(19[2-9]\\d|200\\d)年(\\d{1,2}月)?(\\d{1,2}日)?[^。]{0,60}|(19[2-9]\\d|200\\d)年(\\d{1,2}月)?(\\d{1,2}日)?[^。]{0,8}(出生|生)[^。]{0,40}`)
  let n = 0
  for (const block of html.split(/<div data-pcurl="/).slice(1)) {
    const url = block.slice(0, block.indexOf('"')).replace(/&amp;/g, '&')
    const text = clean('<x ' + block)
    if (!text.includes(j.name)) continue
    const m = text.match(re)
    if (!m) continue
    const site = block.match(/res-site-(?:name|url)'?"?>([^<]+)/)?.[1] ?? ''
    const time = block.match(/<time>([^<]+)/)?.[1] ?? ''
    out.push(`   ${url}\t${site}\t${time}\n      ${m[0].slice(0, 160)}`)
    if (++n >= 6) break
  }
  writeFileSync(`.probe/bd1-so-${suffix}.txt`, out.join('\n') + '\n', 'utf8')
  await new Promise((s) => setTimeout(s, Number(delay) * 1000))
}
writeFileSync(`.probe/bd1-so-${suffix}.txt`, out.join('\n') + '\n## DONE\n', 'utf8')

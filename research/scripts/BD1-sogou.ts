// BD1: Sogou web search for birth dates of people still missing born; reads .probe/bd1-left.txt
//   node research/scripts/BD1-sogou.ts <out-suffix> <delay-s> [id ...]          -> .probe/bd1-se-<suffix>.txt
//   node research/scripts/BD1-sogou.ts <out-suffix> <delay-s> --born [skip-id ...]
//   node research/scripts/BD1-sogou.ts <out-suffix> <delay-s> --q "名字|查询词" ...
// Each hit line: resolved result URL, then the snippet around the birth date.
import { readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const [suffix, delay, ...rest] = process.argv.slice(2)
const raw = readFileSync('.probe/bd1-left.txt', 'utf8')
const rows = raw.split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'))
const byId = new Map(rows.map((r) => [r[0], r]))
const bornIds = raw.split('# no positions')[0].split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t')[0])

const jobs: { id: string; name: string; q: string }[] = []
if (rest[0] === '--q') for (const s of rest.slice(1)) { const [name, q] = s.split('|'); jobs.push({ id: '-', name, q }) }
else {
  const skip = new Set(rest.slice(1))
  const ids = rest[0] === '--born' ? bornIds.filter((id) => !skip.has(id)) : rest
  for (const id of ids) {
    const r = byId.get(id)
    if (!r) continue
    const org = (r[4] ?? '').split(/[，,；]/)[0].replace(/原/g, '').slice(0, 14)
    jobs.push({ id, name: r[1], q: `${r[1]} ${org} 简历 出生` })
  }
}
const clean = (t: string) =>
  t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&ensp;|&#0183;|&amp;/g, ' ').replace(/\s+/g, ' ')
const get = async (u: string) => {
  const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9', Referer: 'https://www.sogou.com/' }, signal: AbortSignal.timeout(25000), redirect: 'follow' })
  return { url: r.url, text: await r.text() }
}
async function resolve(href: string) {
  if (!href.startsWith('/link?')) return href
  try {
    const { text } = await get('https://www.sogou.com' + href)
    return text.match(/replace\("([^"]+)"\)/)?.[1] ?? text.match(/URL='([^']+)'/)?.[1] ?? 'sogou' + href
  } catch {
    return 'sogou' + href
  }
}
const out: string[] = []
for (const j of jobs) {
  let html = ''
  try { html = (await get('https://www.sogou.com/web?query=' + encodeURIComponent(j.q))).text } catch {}
  if (process.env.BD1_DUMP) writeFileSync(`.probe/bd1-se-dump-${j.id}.html`, html, 'utf8')
  const blocked = html.length < 5000 || /antispider|验证码/.test(html.slice(0, 3000))
  out.push(`## ${j.id}\t${j.q}\t${blocked ? 'BLOCKED' : ''}`)
  const re = new RegExp(`${j.name}[^。]{0,50}?(19[2-9]\\d|200\\d)年(\\d{1,2}月)?(\\d{1,2}日)?[^。]{0,50}`)
  let n = 0
  for (const block of html.split(/<h3/).slice(1)) {
    const href = block.match(/href="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? ''
    const text = clean('<h3' + block)
    const m = text.match(re)
    if (!m) continue
    const title = text.slice(0, 50).trim()
    out.push(`   ${await resolve(href)}\n      ${title} || ${m[0].slice(0, 150)}`)
    if (++n >= 5) break
  }
  writeFileSync(`.probe/bd1-se-${suffix}.txt`, out.join('\n') + '\n', 'utf8')
  await new Promise((s) => setTimeout(s, Number(delay) * 1000))
}
writeFileSync(`.probe/bd1-se-${suffix}.txt`, out.join('\n') + '\n## DONE\n', 'utf8')

// R07 finding aid: candidate R07-src.txt rows from the zh.wikipedia refs cached in .probe/R07-wp/ (person page and
// fall-list rows). CCDI links go through a Wayback id_ snapshot taken within 60 days of the notice (later ones are
// the captcha page); SPP links are skipped (403). Rows still lacking a usable URL are listed as "# NEED".
//   node research/scripts/R07-rows.ts who=name[=page] ...   -> .probe/R07-rows.txt
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

const file = (t: string) => `.probe/R07-wp/${t.replace(/[\\/:*?"<>|]/g, '_')}.txt`
const lists = readdirSync('.probe/R07-wp')
  .filter((f) => f.includes('落马官员列表'))
  .map((f) => readFileSync(`.probe/R07-wp/${f}`, 'utf8'))
const kind = (t: string) =>
  /审查调查|接受.*调查|监察调查|严重违纪违法|涉嫌/.test(t) && !/开除|公诉|审判|宣判|判处|受审|获刑|开庭|逮捕/.test(t)
    ? 'probe'
    : /开除党籍|开除公职|双开/.test(t)
      ? 'expel'
      : /公诉|逮捕/.test(t)
        ? 'charge'
        : /受审|开庭|庭审/.test(t)
          ? 'trial'
          : /宣判|判处|获刑|一审|无期|死缓|有期徒刑|被判/.test(t)
            ? 'verdict'
            : ''
type Ref = { date: string; title: string; url: string; arch: string }
const refs = (s: string): Ref[] =>
  [...s.matchAll(/\{\{\s*cite (?:web|news)\s*\|([\s\S]*?)\}\}/gi)].map((m) => {
    const p: Record<string, string> = {}
    for (const kv of m[1].split('|')) {
      const k = kv.indexOf('=')
      if (k > 0) p[kv.slice(0, k).trim().toLowerCase()] = kv.slice(k + 1).trim()
    }
    return { date: p.date ?? '', title: p.title ?? '', url: p.url ?? '', arch: p['archive-url'] || p.archiveurl || '' }
  })
// the date of a notice from its URL (t20241228_, /20241228/, /2024-12/28/, /202412/28/, /n1/2024/1017/)
function urlDate(u: string): string {
  const m =
    u.match(/t(20\d\d)(\d\d)(\d\d)_/) ??
    u.match(/\/(20\d\d)(\d\d)(\d\d)\//) ??
    u.match(/\/(20\d\d)-(\d\d)\/(\d\d)\//) ??
    u.match(/\/(20\d\d)(\d\d)\/(\d\d)\//) ??
    u.match(/\/(20\d\d)\/(\d\d)(\d\d)\//) ??
    u.match(/(20\d\d)-(\d\d)-(\d\d)/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : ''
}
const archTs = (a: string) => a.match(/web\.archive\.org\/web\/(\d{8})/)?.[1]
const days = (a: string, b: string) => (Date.parse(a) - Date.parse(b)) / 864e5
const OK = /news\.cn|xinhuanet\.com|court\.gov\.cn|chinacourt|people\.com\.cn|peopleapp|people\.cn|cctv\.com|cctv\.cn|youth\.cn/

const out: string[] = []
for (const arg of process.argv.slice(2)) {
  const [who, name, page = name] = arg.split('=')
  out.push(`# ===== ${who} ${name}${page !== name ? ' = ' + page : ''}`)
  const txt = existsSync(file(page)) ? readFileSync(file(page), 'utf8') : ''
  if (txt && !/^(MISSING|FAIL)/.test(txt) && !/\{\{\s*(disambig|消歧义|dab|hndis)/i.test(txt))
    out.push(`${who}|wiki||https://zh.wikipedia.org/zh-hans/${page.replace(/ /g, '_')}|${page.replace(/ \(.*$/, '')}（维基百科）`)
  else out.push(`# NO WIKI PAGE ${page}`)
  const rows = lists.flatMap((l) => l.split(/\n\|-/).filter((r) => r.includes(name)))
  const seen = new Set<string>()
  const got: Record<string, string[]> = {}
  for (const r of [...refs(txt), ...rows.flatMap(refs)]) {
    const k = kind(r.title)
    if (!k || k === 'charge' || !r.title.includes(name) || seen.has(r.url)) continue
    seen.add(r.url)
    const date = urlDate(r.url) || r.date
    let url = ''
    if (/ccdi\.gov\.cn/.test(r.url)) {
      const ts = archTs(r.arch)
      if (ts && date && days(`${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`, date) < 60)
        url = r.arch.replace(/\/web\/(\d+)\//, '/web/$1id_/')
    } else if (OK.test(r.url)) url = r.url.replace(/^http:\/\/www\.news\.cn/, 'http://www.news.cn')
    const line = `${who}|${k}|${date}|${url}|${r.title.replace(/[—-]+(头条|要闻|中央纪委国家监委网站|新华网|中华人民共和国最高人民检察院).*$/, '').replace(/_.*$/, '')}`
    ;(got[k] ??= []).push(url ? line : `# SKIP ${line} <${r.url}>`)
  }
  for (const k of ['probe', 'expel', 'trial', 'verdict']) {
    const ls = got[k] ?? []
    const good = ls.filter((l) => !l.startsWith('#'))
    if (good.length) out.push(good[0], ...good.slice(1).map((l) => '# ALT ' + l))
    out.push(...ls.filter((l) => l.startsWith('#')))
    if (!good.length && k !== 'trial') out.push(`# NEED ${who} ${k}`)
  }
}
writeFileSync('.probe/R07-rows.txt', out.join('\n') + '\n', 'utf8')
console.log(out.length)

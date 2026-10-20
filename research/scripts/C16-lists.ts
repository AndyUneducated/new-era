// C16 discovery: SPP 权威发布 year lists (indictments) and SPC 重大案件 list (verdicts), matched to R17 pending names.
// node research/scripts/C16-lists.ts [fetch]  ->  .probe/c16-lists-raw.txt (all items), .probe/c16-lists.txt (hits)
// Pages are cached as .probe/c16-l-*.html, so a rerun only fetches pages that failed before.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const RAW = join(ROOT, '.probe/c16-lists-raw.txt')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function get(key: string, url: string): Promise<string> {
  const f = join(ROOT, `.probe/c16-l-${key}.html`)
  if (existsSync(f)) return readFileSync(f, 'utf8')
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' }, signal: AbortSignal.timeout(45000) })
      if (res.status === 404) return ''
      const t = await res.text()
      if (res.ok) {
        writeFileSync(f, t, 'utf8')
        return t
      }
    } catch {}
    await sleep(3000)
  }
  console.log('FAIL', url)
  return ''
}

if (process.argv.includes('fetch') || !existsSync(RAW)) {
  const items: string[] = []
  for (let y = 2014; y <= 2025; y++) {
    let pages = 1
    for (let p = 0; p < pages; p++) {
      const url = `https://login.12309.gov.cn:8443/spp/qwfb/${y}nian/index${p ? `_${p}` : ''}.shtml`
      const html = await get(`spp-${y}-${p}`, url)
      pages = Math.max(pages, Number(html.match(/createPageHTML\('page_div',\s*(\d+)/)?.[1] ?? 1))
      const got = [...html.matchAll(/<a[^>]*href="([^"]*\/qwfb\/\d{6}\/t\d+_\d+\.shtml)"[^>]*>([\s\S]*?)<\/a>\s*<span>(20\d\d-\d\d-\d\d)/g)]
      for (const m of got) items.push(`${m[3]}\tspp\t${m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, '')}\thttps://login.12309.gov.cn:8443${m[1].replace(/^https?:\/\/[^/]+/, '')}`)
      console.log(y, p, pages, got.length)
    }
  }
  for (let p = 1; p <= 28; p++) {
    const html = await get(`spc-${p}`, `https://www.court.gov.cn/fabu/gengduo/15${p > 1 ? `_${p}` : ''}.html`)
    const got = [...html.matchAll(/href="(\/fabu\/xiangqing\/\d+\.html)"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,200}?(20\d\d-\d\d-\d\d)/g)]
    for (const m of got) items.push(`${m[3]}\tspc\t${m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, '')}\thttps://www.court.gov.cn${m[1]}`)
    console.log('spc', p, got.length)
  }
  writeFileSync(RAW, [...new Set(items)].join('\n') + '\n', 'utf8')
}

const items = readFileSync(RAW, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'))
const list = readFileSync(join(ROOT, 'research/lists/R17-pending-cases.txt'), 'utf8').split(/\r?\n/).filter(Boolean).map((l) => l.split('\t'))
const out: string[] = []
for (const [id, name, outcome, sys, , last, blurb] of list) {
  if (sys === 'other' || sys === 'army') continue
  const hits = items.filter(([, , t]) => {
    const i = t.indexOf(name)
    return i >= 0 && /[受贪滥行利挪等案非玩国内洗故、涉]/.test(t[i + name.length] ?? '')
  })
  if (hits.length) out.push(`## ${id} ${name} ${outcome} ${last} ${blurb}`, ...hits.map((h) => '  ' + h.join(' | ')), '')
}
writeFileSync(join(ROOT, '.probe/c16-lists.txt'), out.join('\n'), 'utf8')
console.log('items', items.length, 'people', out.filter((l) => l.startsWith('##')).length)

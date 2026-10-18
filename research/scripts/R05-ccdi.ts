// Reads Wayback raw snapshots of the CCDI column "审查调查 · 中管干部 · 执纪审查" and lists every notice title with
// its date, a research aid for research/falls-list/R05.yaml (www.ccdi.gov.cn itself answers scripts with a captcha).
//   node research/scripts/R05-ccdi.ts [timestamp/url ...]   -> .probe/R05-ccdi.txt
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
const args = process.argv.slice(2)
const snaps = args.length
  ? args
  : [
      '20211031092939/https://www.ccdi.gov.cn/scdc/zggb/zjsc/',
      '20220314145811/https://www.ccdi.gov.cn/scdcn/zggb/zjsc/',
      '20220630033016/https://www.ccdi.gov.cn/scdc/zggb/zjsc/',
      '20221206174700/https://www.ccdi.gov.cn/scdcn/zggb/zjsc/',
      '20230130014403/http://www.ccdi.gov.cn/scdc/zggb/zjsc/',
      '20230320141623/https://www.ccdi.gov.cn/scdcn/zggb/zjsc/',
      '20230606163350/https://www.ccdi.gov.cn/scdcn/zggb/zjsc/',
      '20231207103141/https://www.ccdi.gov.cn/scdcn/zggb/zjsc/',
      '20240226142938/http://www.ccdi.gov.cn/scdc/zggb/zjsc/',
    ]
const seen = new Map<string, string>()
const out: string[] = []
for (const s of snaps) {
  const [ts, ...rest] = s.split('/')
  const url = `https://web.archive.org/web/${ts}id_/${rest.join('/')}`
  let html = ''
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    html = new TextDecoder('utf-8').decode(await r.arrayBuffer())
    out.push(`=== ${s}  HTTP ${r.status}  ${html.length} bytes`)
  } catch (e) {
    out.push(`=== ${s}  FAIL ${(e as Error).message}`)
    continue
  }
  let n = 0
  for (const m of html.matchAll(/<a[^>]+href="([^"]*t(\d{8})_\d+\.html)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const title = m[3].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (!title) continue
    const d = m[2]
    const key = `${d} ${title}`
    n++
    if (!seen.has(key)) seen.set(key, m[1])
  }
  out.push(`  ${n} links`)
}
const lines = [...seen].sort().map(([k, href]) => `${k}\t${href}`)
writeFileSync(join(ROOT, '.probe', 'R05-ccdi.txt'), out.join('\n') + '\n\n' + lines.join('\n') + '\n')
console.log(out.join('\n'))

// Pulls the notice links out of T01's raw CCDI column snapshots (sources/raw/t01-ccdi-*-list-*.html).
//   node research/scripts/R01-links.ts   -> .probe/R01-links.txt  (title \t date \t absolute url)
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const pages: Record<string, string> = {
  'zjsc-list-p6': 'http://www.ccdi.gov.cn/scdc/zggb/zjsc/',
  'zjsc-list-p5': 'http://www.ccdi.gov.cn/scdc/zggb/zjsc/',
  'zjsc-list-p4': 'http://www.ccdi.gov.cn/scdc/zggb/zjsc/',
  'jlsc-list-p3': 'http://www.ccdi.gov.cn/jlsc/zggb/jlsc_zggb/',
  'djcf-list-p8': 'http://www.ccdi.gov.cn/scdc/zggb/djcf/',
  'djcf-list-p7': 'http://www.ccdi.gov.cn/scdc/zggb/djcf/',
  'djcf-list-p6': 'http://www.ccdi.gov.cn/scdc/zggb/djcf/',
}
const out: string[] = []
for (const [p, base] of Object.entries(pages)) {
  const html = readFileSync(join(ROOT, `sources/raw/t01-ccdi-${p}.html`), 'utf8')
  for (const m of html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]{0,200}?(\d{4}-\d{2}-\d{2})/g)) {
    const title = m[2].replace(/<[^>]+>/g, '').trim()
    if (!/调查|开除|双开|审查|处分/.test(title)) continue
    let href = m[1].replace(/^https?:\/\/web\.archive\.org\/web\/\d+(id_)?\//, '')
    if (href.startsWith('/web/')) href = href.replace(/^\/web\/\d+(id_)?\//, '')
    const url = new URL(href, base).href.replace(':80/', '/')
    out.push(`${p}\t${m[3]}\t${title}\t${url}`)
  }
}
writeFileSync(join(ROOT, '.probe/R01-links.txt'), out.join('\n') + '\n')
console.log(out.length)

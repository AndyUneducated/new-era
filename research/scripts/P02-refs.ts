// One-off: list the news links (Xinhua, People's Daily, gov.cn …) cited in the fetched P02 Wikipedia pages,
// to find appointment notices. Output .probe/p02-refs.txt.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const hosts = /(news\.cn|xinhuanet\.com|gov\.cn|people\.com\.cn|people\.cn|ce\.cn|chinanews|cctv\.com|ccdi\.gov\.cn|thepaper\.cn)/
const out: string[] = []
for (const f of readdirSync('sources/raw').filter((f) => f.startsWith('p02-wiki-'))) {
  const html = readFileSync(`sources/raw/${f}`, 'utf8')
  const seen = new Set<string>()
  for (const m of html.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [, url, inner] = m
    if (!hosts.test(url) || url.includes('web.archive.org') || seen.has(url)) continue
    seen.add(url)
    const text = inner.replace(/<[^>]+>/g, '').trim()
    if (/20(1[6-9]|2\d)/.test(url) || /代|当选|任|书记|省长|主席|市长/.test(text)) out.push(`${f.replace('.html', '')}\t${text}\t${url}`)
  }
}
writeFileSync('.probe/p02-refs.txt', out.join('\n') + '\n')
console.log(out.length)

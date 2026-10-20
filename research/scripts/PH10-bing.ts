// Image search leads: for each query, the first results of 360 image search (picture URL, page URL, title) go to
// .probe/PH10-bing.txt. Only leads: every picture is then checked on its own page (caption, who is shown).
//   node research/scripts/PH10-bing.ts [--n=12] "王伟光 社科院" "白克明 河北省委书记" …
//   node research/scripts/PH10-bing.ts [--n=12] [--out=x] --file=<id TAB query per line>
// Writes to .probe/PH10-bing[-x].txt.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const n = Number(args.find((a) => a.startsWith('--n='))?.slice(4) ?? 12)
const out = `.probe/PH10-bing${args.find((a) => a.startsWith('--out='))?.replace('--out=', '-') ?? ''}.txt`
writeFileSync(out, '')
const clean = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const file = args.find((a) => a.startsWith('--file='))?.slice(7)
const queries = file
  ? readFileSync(file, 'utf8').split('\n').filter((l) => l.includes('\t')).map((l) => l.split('\t')[1].trim())
  : args.filter((a) => !a.startsWith('--'))
for (const q of queries) {
  try {
    const res = await fetch(`https://image.so.com/j?${new URLSearchParams({ q, src: 'srp', sn: '0', pn: String(n) })}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9', Referer: 'https://image.so.com/' },
    })
    const j = (await res.json()) as { list?: { img: string; link: string; title: string; width: string; height: string; thumb: string }[] }
    appendFileSync(out, `== ${q} (${res.status})\n`)
    for (const r of (j.list ?? []).slice(0, n)) appendFileSync(out, `${r.img}\t${r.link}\t${r.width}x${r.height}\t${clean(r.title)}\t${r.thumb}\n`)
    appendFileSync(out, '\n')
  } catch (e) {
    appendFileSync(out, `== ${q}\nERR ${(e as Error).message}\n\n`)
  }
  await new Promise((r) => setTimeout(r, 800))
}
console.log('done')

/// <reference lib="dom" />
// Contact sheet of candidate pictures before they go into PH10.yaml: each argument is label=<image URL>[|<referer>]
// or label=File:<Commons name> (also prints that file's description, author and date to .probe/PH10-cand.txt).
// Writes .probe/PH10-cand[-tag].png; with --big the cells are twice as large, for faces in group pictures.
//   node research/scripts/PH10-cand.ts [--tag=x] [--big] a1=https://…|https://page "b2=File:Teng Biao.JPG" …
import { appendFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const WUA = 'new-era-research/0.1 (https://github.com/AndyUneducated/new-era)'
const args = process.argv.slice(2)
const tag = args.find((a) => a.startsWith('--tag='))?.slice(6) ?? ''
const big = args.includes('--big')
const txt = '.probe/PH10-cand.txt'
writeFileSync(txt, '')
const strip = (h?: string) => h?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() ?? ''
const cells: string[] = []
for (const arg of args.filter((a) => !a.startsWith('--'))) {
  const i = arg.indexOf('=')
  const label = arg.slice(0, i)
  let [src, referer] = arg.slice(i + 1).split('|')
  try {
    if (src.startsWith('File:')) {
      const u = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ action: 'query', format: 'json', titles: src, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: big ? '960' : '480' })}`
      const r = (await (await fetch(u, { headers: { 'User-Agent': WUA } })).json()) as any
      const info = (Object.values(r.query.pages)[0] as any).imageinfo[0]
      const m = info.extmetadata
      appendFileSync(txt, `${label}\t${src}\n  ${strip(m.ImageDescription?.value).slice(0, 400)}\n  ${strip(m.Artist?.value)} | ${strip(m.LicenseShortName?.value)} | ${strip(m.DateTimeOriginal?.value)}\n`)
      src = info.thumburl
    }
    const res = await fetch(src, { headers: { 'User-Agent': src.includes('wikimedia') ? WUA : UA, ...(referer ? { Referer: referer } : {}) } })
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    cells.push(`<div class=cell><img src="data:${type};base64,${buf.toString('base64')}"><div>${label} ${res.status} ${Math.round(buf.length / 1024)}KB</div></div>`)
  } catch (e) {
    cells.push(`<div class=cell><b>${label} ERR ${(e as Error).message}</b></div>`)
  }
}
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
const [cw, ch, cols] = big ? [460, 420, 3] : [220, 240, 5]
await page.setContent(`<style>body{margin:0;font:13px sans-serif;background:#ddd}
  .grid{display:grid;grid-template-columns:repeat(${cols},${cw + 10}px);gap:4px;padding:4px}
  .cell{background:#fff;padding:4px}.cell img{width:${cw}px;height:${ch}px;object-fit:contain;background:#eee}</style>
  <div class=grid>${cells.join('')}</div>`)
await page.waitForTimeout(300)
const out = `.probe/PH10-cand${tag}.png`
await page.locator('.grid').screenshot({ path: out })
await browser.close()
console.log(out)

/// <reference lib="dom" />
// Contact sheet of candidate pictures before they go into PH7.yaml: each argument is label=<Baike pic hash> or
// label=<image URL>[|<referer>]. Writes .probe/PH7-cand.png.
//   node research/scripts/PH7-cand.ts zyx1=342ac… sun2=https://…|https://page …
import { chromium } from '@playwright/test'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const cells: string[] = []
for (const arg of process.argv.slice(2)) {
  const i = arg.indexOf('=')
  const label = arg.slice(0, i)
  const [src, referer] = arg.slice(i + 1).split('|')
  const url = /^https?:/.test(src) ? src : `https://bkimg.cdn.bcebos.com/pic/${src}?x-bce-process=image/resize,m_lfit,w_480`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...(referer ? { Referer: referer } : {}) } })
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    cells.push(`<div class=cell><img src="data:${type};base64,${buf.toString('base64')}"><div>${label} ${res.status} ${Math.round(buf.length / 1024)}KB</div></div>`)
  } catch (e) {
    cells.push(`<div class=cell><b>${label} ERR ${(e as Error).message}</b></div>`)
  }
}
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })
await page.setContent(`<style>body{margin:0;font:13px sans-serif;background:#ddd}
  .grid{display:grid;grid-template-columns:repeat(4,290px);gap:4px;padding:4px}
  .cell{background:#fff;padding:4px}.cell img{width:280px;height:300px;object-fit:contain;background:#eee}</style>
  <div class=grid>${cells.join('')}</div>`)
await page.waitForTimeout(300)
await page.locator('.grid').screenshot({ path: '.probe/PH7-cand.png' })
await browser.close()
console.log('.probe/PH7-cand.png')

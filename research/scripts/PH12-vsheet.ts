/// <reference lib="dom" />
// Contact sheets of the candidate pictures downloaded by PH12-get.ts (.probe/PH12-view), for looking at them before
// making an entry: each cell is the whole picture with its file name and pixel size. Writes .probe/PH12-vsheet<tag>-<n>.png.
//   node research/scripts/PH12-vsheet.ts [--per=12] [--tag=x] [name prefix …]   (no prefix: every file)
import { readdirSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const per = Number(args.find((a) => a.startsWith('--per='))?.slice(6) ?? 12)
const tag = args.find((a) => a.startsWith('--tag='))?.slice(6) ?? ''
const want = args.filter((a) => !a.startsWith('--'))
const DIR = '.probe/PH12-view'
const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
const files = readdirSync(DIR)
  .filter((f) => !want.length || want.some((w) => f.replace(/\.\w+$/, '') === w || f.replace(/\.\w+$/, '').replace(/-\d$/, '') === w))
  .sort()
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } })
for (let s = 0; s * per < files.length; s++) {
  const cells = files.slice(s * per, (s + 1) * per).map((f) => {
    const data = `data:${MIME[f.split('.').pop()!]};base64,${readFileSync(`${DIR}/${f}`).toString('base64')}`
    return `<div class=cell><img src="${data}" onload="this.nextSibling.textContent+=' '+this.naturalWidth+'x'+this.naturalHeight"><div class=lab>${f}</div></div>`
  })
  await page.setContent(`<style>
    body{margin:0;font:14px sans-serif;background:#ccc}
    .grid{display:grid;grid-template-columns:repeat(4,315px);gap:4px;padding:4px}
    .cell{background:#fff;padding:3px}
    img{width:309px;height:300px;object-fit:contain;background:#eee;display:block}
    .lab{height:18px;overflow:hidden}
  </style><div class=grid>${cells.join('')}</div>`)
  await page.waitForTimeout(300)
  const out = `.probe/PH12-vsheet${tag}-${s + 1}.png`
  await page.locator('.grid').screenshot({ path: out })
  console.log(out)
}
await browser.close()

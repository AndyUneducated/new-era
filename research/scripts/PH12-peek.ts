/// <reference lib="dom" />
// Contact sheet of downloaded candidates in .probe/PH12-view (each labelled with its file name and size), for
// looking at many leads at once. Writes .probe/PH12-peek-<tag>.png.
//   node research/scripts/PH12-peek.ts --tag=a [--h=260] name1 name2 …   (names without extension)
import { existsSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const tag = args.find((a) => a.startsWith('--tag='))?.slice(6) ?? 'x'
const h = Number(args.find((a) => a.startsWith('--h='))?.slice(4) ?? 260)
const DIR = '.probe/PH12-view'
const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
const cells = args
  .filter((a) => !a.startsWith('--'))
  .map((n) => {
    const ext = ['jpg', 'png', 'webp', 'gif'].find((x) => existsSync(`${DIR}/${n}.${x}`))
    if (!ext) return `<div class=c><b>${n}: none</b></div>`
    const data = `data:${MIME[ext]};base64,${readFileSync(`${DIR}/${n}.${ext}`).toString('base64')}`
    return `<div class=c><img src="${data}" onload="this.nextSibling.textContent+=' '+this.naturalWidth+'x'+this.naturalHeight"><div>${n}</div></div>`
  })
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
await page.setContent(`<style>body{margin:0;font:13px sans-serif;background:#ccc}.g{display:flex;flex-wrap:wrap;gap:4px;padding:4px;width:1392px}
.c{background:#fff;padding:3px}.c img{height:${h}px;display:block}</style><div class=g>${cells.join('')}</div>`)
await page.waitForTimeout(500)
await page.locator('.g').screenshot({ path: `.probe/PH12-peek-${tag}.png` })
await browser.close()
console.log(`.probe/PH12-peek-${tag}.png`)

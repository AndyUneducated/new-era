/// <reference lib="dom" />
// Batch form of PH12-crop.ts: one browser for many crops. Reads a list of lines "id TAB source file TAB x,y,w,h"
// (source under .probe/PH12-view, box in fractions of the full image, "-" for the whole picture), keeps each
// source in .probe/PH12-orig/<id>.<ext> and writes public/photos/<id>.jpg at most 480 wide. Refuses an id that is
// not a PH12 entry, and a public/photos file that some other batch wrote.
//   node research/scripts/PH12-cropall.ts <list file> [id …]
import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { parse } from 'yaml'

const [list, ...only] = process.argv.slice(2)
const mine = Object.keys(parse(readFileSync('content/photos/PH12.yaml', 'utf8')) ?? {})
const ORIG = '.probe/PH12-orig'
mkdirSync(ORIG, { recursive: true })
const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const rows = readFileSync(list, 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.split('\t'))
  .filter(([id]) => !only.length || only.includes(id))
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage()
await page.setContent('<canvas></canvas>')
for (const [id, src, box] of rows) {
  try {
    if (!mine.includes(id)) throw new Error('not a PH12 entry')
    const out = `public/photos/${id}.jpg`
    const ext = src.split('.').pop()!.toLowerCase()
    const kept = `${ORIG}/${id}.${ext}`
    const others = ['jpg', 'png', 'webp'].map((x) => `public/photos/${id}.${x}`).filter((f) => existsSync(f))
    if (others.length && !existsSync(kept)) throw new Error(`${others[0]} exists and was not written by PH12`)
    copyFileSync(`.probe/PH12-view/${src}`, kept)
    const data = `data:${MIME[ext]};base64,${readFileSync(kept).toString('base64')}`
    const [x, y, w, h] = box === '-' ? [0, 0, 1, 1] : box.split(',').map(Number)
    const [b64, size] = await page.evaluate(
      async ({ data, x, y, w, h }) => {
        const img = new Image()
        img.src = data
        await img.decode()
        const sx = img.naturalWidth * x
        const sy = img.naturalHeight * y
        const sw = img.naturalWidth * w
        const sh = img.naturalHeight * h
        const ow = Math.min(480, Math.round(sw))
        const oh = Math.round((sh * ow) / sw)
        const c = document.createElement('canvas')
        c.width = ow
        c.height = oh
        const g = c.getContext('2d')!
        g.imageSmoothingQuality = 'high'
        g.drawImage(img, sx, sy, sw, sh, 0, 0, ow, oh)
        return [c.toDataURL('image/jpeg', 0.9).split(',')[1], `${ow}x${oh} from ${Math.round(sw)}x${Math.round(sh)}`]
      },
      { data, x, y, w, h },
    )
    writeFileSync(out, Buffer.from(b64, 'base64'))
    for (const f of others) if (f !== out) unlinkSync(f)
    console.log(`ok ${id} ${size}`)
  } catch (e) {
    console.log(`ERR ${id} ${(e as Error).message}`)
  }
}
await browser.close()

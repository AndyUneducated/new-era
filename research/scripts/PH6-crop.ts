/// <reference lib="dom" />
// Crops a head-and-shoulders portrait out of a group or news photo and writes public/photos/<id>.jpg (at most 480
// wide). The crop box is given in fractions of the full image: x,y,w,h. Refuses to overwrite a file that is not
// this batch's (an id without a PH6 entry). With --peek only writes the full image, with a 10% grid, to
// .probe/PH6-peek-<id>.png for choosing the box.
//   node research/scripts/PH6-crop.ts <id> <image url> <referer> <x,y,w,h>
//   node research/scripts/PH6-crop.ts --peek <id> <image url> <referer>
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { parse } from 'yaml'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const args = process.argv.slice(2)
const peek = args.includes('--peek')
const [id, src, referer, box] = args.filter((a) => !a.startsWith('--'))
const out = `public/photos/${id}.jpg`
const mine = Object.keys(parse(readFileSync('content/photos/PH6.yaml', 'utf8')) ?? {})
if (!peek && existsSync(out) && !mine.includes(id)) throw new Error(`${out} exists and is not a PH6 entry`)

const res = await fetch(src, { headers: { 'User-Agent': UA, ...(referer ? { Referer: referer } : {}) } })
if (!res.ok) throw new Error(`${res.status} ${src}`)
const type = res.headers.get('content-type') ?? 'image/jpeg'
const data = `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`
const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
await page.setContent('<canvas></canvas>')
if (peek) {
  const png = await page.evaluate(async (data) => {
    const img = new Image()
    img.src = data
    await img.decode()
    const w = Math.min(1400, img.naturalWidth)
    const h = Math.round((img.naturalHeight * w) / img.naturalWidth)
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')!
    g.drawImage(img, 0, 0, w, h)
    g.strokeStyle = 'rgba(255,0,0,.6)'
    g.fillStyle = 'red'
    g.font = '14px sans-serif'
    for (let i = 1; i < 10; i++) {
      g.beginPath()
      g.moveTo((w * i) / 10, 0)
      g.lineTo((w * i) / 10, h)
      g.moveTo(0, (h * i) / 10)
      g.lineTo(w, (h * i) / 10)
      g.stroke()
      g.fillText(String(i), (w * i) / 10 + 2, 14)
      g.fillText(String(i), 2, (h * i) / 10 - 2)
    }
    return [c.toDataURL('image/png').split(',')[1], `${img.naturalWidth}x${img.naturalHeight}`]
  }, data)
  writeFileSync(`.probe/PH6-peek-${id}.png`, Buffer.from(png[0], 'base64'))
  console.log(`.probe/PH6-peek-${id}.png ${png[1]}`)
} else {
  const [x, y, w, h] = box.split(',').map(Number)
  const jpg = await page.evaluate(
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
  writeFileSync(out, Buffer.from(jpg[0], 'base64'))
  console.log(`${out} ${jpg[1]}`)
}
await browser.close()

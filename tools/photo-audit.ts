/// <reference lib="dom" />
// Portrait audit (decisions #36, #38): node tools/photo-audit.ts [--shrink] [id …]
// Measures every file in public/photos for colour (Hasler–Süsstrunk colourfulness; below GREY it is black and
// white or nearly so) and size, and writes the list to .probe/photo-audit.json.
// --shrink re-encodes files wider than OVER_W or heavier than MAX_KB as a JPEG MAX_W wide.
import { mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'public', 'photos')
const MAX_W = 480
// Commons thumbnails come 480–500 wide; only larger files are re-encoded
const OVER_W = 600
const MAX_KB = 160
const GREY = 12

const args = process.argv.slice(2)
const shrink = args.includes('--shrink')
const only = new Set(args.filter((a) => !a.startsWith('--')))
const files = readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && (!only.size || only.has(f.replace(/\.\w+$/, ''))))

const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'msedge' })
const page = await browser.newPage()
await page.setContent('<canvas></canvas>')

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const out: { id: string; file: string; w: number; h: number; kb: number; colour: number; grey: boolean }[] = []
let shrunk = 0
for (const f of files) {
  const ext = f.split('.').pop()!.toLowerCase()
  const buf = readFileSync(join(DIR, f))
  const kb = Math.round(buf.length / 1024)
  const r = await page
    .evaluate(
      async ({ data }) => {
        const img = new Image()
        img.src = data
        await img.decode()
        const c = document.createElement('canvas')
        // colour from the middle of the frame, where the face is, at 96 px
        const s = 96
        c.width = s
        c.height = s
        const g = c.getContext('2d')!
        g.drawImage(img, img.naturalWidth * 0.15, img.naturalHeight * 0.05, img.naturalWidth * 0.7, img.naturalHeight * 0.7, 0, 0, s, s)
        const px = g.getImageData(0, 0, s, s).data
        let n = 0, mrg = 0, myb = 0, srg = 0, syb = 0
        for (let i = 0; i < px.length; i += 4) {
          const rg = px[i] - px[i + 1]
          const yb = (px[i] + px[i + 1]) / 2 - px[i + 2]
          n++
          mrg += rg
          myb += yb
          srg += rg * rg
          syb += yb * yb
        }
        mrg /= n
        myb /= n
        const sd = Math.sqrt(srg / n - mrg * mrg + (syb / n - myb * myb))
        const colour = sd + 0.3 * Math.sqrt(mrg * mrg + myb * myb)
        return { w: img.naturalWidth, h: img.naturalHeight, colour }
      },
      { data: `data:${MIME[ext]};base64,${buf.toString('base64')}` },
    )
    .catch((e: Error) => ({ error: e.message }))
  if ('error' in r) {
    console.log(`FAIL ${f}: ${r.error}`)
    continue
  }
  const id = f.replace(/\.\w+$/, '')
  out.push({ id, file: f, w: r.w, h: r.h, kb, colour: Math.round(r.colour * 10) / 10, grey: r.colour < GREY })
  if (shrink && (r.w > OVER_W || kb > MAX_KB)) {
    const j = await page.evaluate(
      async ({ data, maxW }) => {
        const img = new Image()
        img.src = data
        await img.decode()
        const w = Math.min(maxW, img.naturalWidth)
        const h = Math.round((img.naturalHeight * w) / img.naturalWidth)
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const g = c.getContext('2d')!
        g.fillStyle = '#fff'
        g.fillRect(0, 0, w, h)
        g.drawImage(img, 0, 0, w, h)
        return c.toDataURL('image/jpeg', 0.86).split(',')[1]
      },
      { data: `data:${MIME[ext]};base64,${buf.toString('base64')}`, maxW: MAX_W },
    )
    const tmp = join(DIR, `${id}.tmp`)
    writeFileSync(tmp, Buffer.from(j, 'base64'))
    if (ext !== 'jpg') unlinkSync(join(DIR, f))
    renameSync(tmp, join(DIR, `${id}.jpg`))
    shrunk++
    console.log(`shrunk ${f} ${kb} KB -> ${Math.round(statSync(join(DIR, `${id}.jpg`)).size / 1024)} KB`)
  }
}
await browser.close()
mkdirSync(join(ROOT, '.probe'), { recursive: true })
writeFileSync(join(ROOT, '.probe', 'photo-audit.json'), JSON.stringify(out, null, 1))
console.log(`${out.length} photos, ${out.filter((o) => o.grey).length} black and white, ${shrunk} shrunk`)

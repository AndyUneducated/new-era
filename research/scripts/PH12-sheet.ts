/// <reference lib="dom" />
// Contact sheets for checking PH12 portraits by eye: each cell shows the whole file and the square crop the site
// shows (object-position = focus), labelled with id, name and headline. Writes .probe/PH12-sheet<tag>-<n>.png.
//   node research/scripts/PH12-sheet.ts [--per=16] [--tag=x] id1 id2 …
//   node research/scripts/PH12-sheet.ts --all [--per=16] [--tag=x]   every entry of PH12.yaml
//   node research/scripts/PH12-sheet.ts --jpg id …      re-encode PNG/WebP files of these ids as JPEG
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'
import { parse } from 'yaml'

const args = process.argv.slice(2)
const photos = (parse(readFileSync('content/photos/PH12.yaml', 'utf8')) ?? {}) as Record<string, { focus?: string }>
const ids = args.includes('--all') ? Object.keys(photos) : args.filter((a) => !a.startsWith('--'))
const per = Number(args.find((a) => a.startsWith('--per='))?.slice(6) ?? 16)
const tag = args.find((a) => a.startsWith('--tag='))?.slice(6) ?? ''
const DIR = 'public/photos'
const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const fileOf = (id: string) => ['jpg', 'png', 'webp'].map((x) => `${id}.${x}`).find((f) => existsSync(join(DIR, f)))
const dataOf = (f: string) => `data:${MIME[f.split('.').pop()!]};base64,${readFileSync(join(DIR, f)).toString('base64')}`

const browser = await chromium.launch({ channel: 'msedge' })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } })

if (args.includes('--jpg')) {
  for (const id of ids) {
    const f = fileOf(id)
    if (!f || f.endsWith('.jpg')) continue
    await page.setContent('<canvas></canvas>')
    const j = await page.evaluate(async (data) => {
      const img = new Image()
      img.src = data
      await img.decode()
      const w = Math.min(480, img.naturalWidth)
      const h = Math.round((img.naturalHeight * w) / img.naturalWidth)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const g = c.getContext('2d')!
      g.fillStyle = '#fff'
      g.fillRect(0, 0, w, h)
      g.drawImage(img, 0, 0, w, h)
      return c.toDataURL('image/jpeg', 0.86).split(',')[1]
    }, dataOf(f))
    writeFileSync(join(DIR, `${id}.jpg`), Buffer.from(j, 'base64'))
    unlinkSync(join(DIR, f))
    console.log(`jpg ${id}`)
  }
} else {
  const roles = new Map(
    readFileSync('research/lists/R16-photo-next2.txt', 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split('\t'))
      .map((c) => [c[1], `${c[2]} ${c[3]}`] as const),
  )
  for (let s = 0; s * per < ids.length; s++) {
    const cells = ids.slice(s * per, (s + 1) * per).map((id) => {
      const f = fileOf(id)
      const focus = photos[id]?.focus ?? '50% 25%'
      const img = f ? `<img class=full src="${dataOf(f)}"><img class=crop src="${dataOf(f)}" style="object-position:${focus}">` : '<b>no file</b>'
      return `<div class=cell><div class=pics>${img}</div><div class=lab>${id}<br>${(roles.get(id) ?? '').slice(0, 36)}</div></div>`
    })
    await page.setContent(`<style>
      body{margin:0;font:13px sans-serif;background:#ddd}
      .grid{display:grid;grid-template-columns:repeat(4,295px);gap:4px;padding:4px}
      .cell{background:#fff;padding:4px}
      .pics{display:flex;gap:4px;align-items:flex-start;height:220px}
      .full{width:180px;height:220px;object-fit:contain;background:#eee}
      .crop{width:100px;height:100px;object-fit:cover}
      .lab{height:34px;overflow:hidden;line-height:17px}
    </style><div class=grid>${cells.join('')}</div>`)
    const out = `.probe/PH12-sheet${tag}-${s + 1}.png`
    await page.locator('.grid').screenshot({ path: out })
    console.log(out)
  }
}
await browser.close()

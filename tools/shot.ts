// Screenshots for review and the README: node tools/shot.ts [--dark] [--phone] [--full] [--el=selector] [--out=dir] route…
// Expects a server on 4189 (npm run dev -- --port 4189 or npm run preview -- --port 4189).
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const dark = args.includes('--dark')
const phone = args.includes('--phone')
const out = args.find((a) => a.startsWith('--out='))?.slice(6) ?? '.probe/shots'
// --el=.network shoots one element instead of the viewport
const el = args.find((a) => a.startsWith('--el='))?.slice(5)
const routes = args.filter((a) => !a.startsWith('--'))
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'msedge' })
const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: phone ? 2 : 1 })
await page.addInitScript((t) => localStorage.setItem('ne-theme', t), dark ? 'dark' : 'light')
const errors: string[] = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
for (const r of routes.length ? routes : ['']) {
  // a dev server on a busy machine can take a minute to serve the first page
  await page.goto(`http://localhost:4189/#/${r}`, { timeout: 120000 })
  await page.waitForSelector('.main', { timeout: 60000 }).catch(() => errors.push(`${r}: no .main`))
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1200)
  // --click=".seg button:nth-child(3)" clicks before the shot (Playwright selectors, | between several)
  for (const sel of args.find((a) => a.startsWith('--click='))?.slice(8).split('|') ?? []) {
    await page.locator(sel).first().click()
    await page.waitForTimeout(1500)
  }
  // --wait=8000 for views that fetch more after the click
  await page.waitForTimeout(Number(args.find((a) => a.startsWith('--wait='))?.slice(7) ?? 0))
  const name = `${(r || 'home').replace(/[/?=&]/g, '_')}${dark ? '-dark' : ''}${phone ? '-phone' : ''}.png`
  // --steps=0,4,9 scrolls each home story step to the middle of the screen and shoots it
  const steps = args.find((a) => a.startsWith('--steps='))?.slice(8).split(',')
  if (steps) {
    for (const i of steps) {
      await page.locator(`.step[data-i="${i}"]`).evaluate((e) => e.scrollIntoView({ block: 'center' }))
      await page.waitForTimeout(1800)
      const n = name.replace('.png', `-s${i}.png`)
      await page.screenshot({ path: `${out}/${n}` })
      console.log(`${out}/${n}`)
    }
    continue
  }
  if (el) await page.locator(el).first().screenshot({ path: `${out}/${name}` })
  else await page.screenshot({ path: `${out}/${name}`, fullPage: args.includes('--full') })
  console.log(`${out}/${name}`)
}
if (errors.length) console.log(`ERRORS\n${errors.join('\n')}`)
await browser.close()

// Screenshots for review and the README: node tools/shot.ts [--dark] [--phone] [--out=dir] route…
// Expects a server on 4189 (npm run dev -- --port 4189 or npm run preview -- --port 4189).
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const dark = args.includes('--dark')
const phone = args.includes('--phone')
const out = args.find((a) => a.startsWith('--out='))?.slice(6) ?? '.probe/shots'
const routes = args.filter((a) => !a.startsWith('--'))
mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel: process.env.CI ? undefined : 'msedge' })
const page = await browser.newPage({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, deviceScaleFactor: phone ? 2 : 1 })
await page.addInitScript((t) => localStorage.setItem('ne-theme', t), dark ? 'dark' : 'light')
const errors: string[] = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
for (const r of routes.length ? routes : ['']) {
  await page.goto(`http://localhost:4189/#/${r}`)
  await page.waitForSelector('.main', { timeout: 20000 }).catch(() => errors.push(`${r}: no .main`))
  await page.waitForTimeout(1200)
  const name = `${(r || 'home').replace(/[/?=&]/g, '_')}${dark ? '-dark' : ''}${phone ? '-phone' : ''}.png`
  await page.screenshot({ path: `${out}/${name}`, fullPage: args.includes('--full') })
  console.log(`${out}/${name}`)
}
if (errors.length) console.log(`ERRORS\n${errors.join('\n')}`)
await browser.close()

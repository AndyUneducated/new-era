// Opens every view on a desktop and a phone screen and fails on script errors or a missing heading.
// Run against a build: npm run build && npm run test:smoke
import { expect, test } from '@playwright/test'

const urls = [
  ['#/', '新时代'],
  ['#/people', '人物'],
  ['#/people/li-keqiang', '李克强'],
  ['#/factions', '派系'],
  ['#/factions/tuanpai', '团派'],
  ['#/timeline', '时间线'],
  ['#/ideas', '思想'],
  ['#/purges', '打虎'],
  ['#/about', '体例'],
] as const

for (const [hash, title] of urls)
  test(hash, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    await page.goto('./' + hash, { waitUntil: 'domcontentloaded' })
    const h1 = page.locator('main h1').first()
    await expect(h1).toBeVisible()
    await expect(h1).toContainText(title)
    // nothing may push the page sideways on a phone
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(over).toBeLessThanOrEqual(1)
    expect(errors).toEqual([])
  })

test('long texts arrive after the first paint', async ({ page }) => {
  await page.goto('./#/people/li-keqiang')
  await expect(page.locator('main h1').first()).toContainText('李克强')
  await expect(page.locator('main a.src[href]').first()).toBeAttached()
  await expect(page.getByText('载入中')).toHaveCount(0)
  await page.goto('./#/purges/zhou-yongkang-network')
  await expect(page.locator('main .life section').first()).toBeVisible()
})

test('search opens with Ctrl K and finds a person', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcut')
  await page.goto('./#/')
  await expect(page.locator('main h1').first()).toBeVisible()
  await page.keyboard.press('Control+k')
  await page.keyboard.type('李克强')
  await page.keyboard.press('Enter')
  await expect(page.locator('main h1').first()).toContainText('李克强')
})

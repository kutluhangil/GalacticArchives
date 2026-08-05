import { expect, test } from '@playwright/test'

// The four archive routes and the top bar's tool panels, end to end: they went
// live with no coverage at all, and the first thing that broke was a header
// that covered the panel underneath it.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ga-onboarded', '1'))
})

const routes = [
  { path: '/timeline', heading: /ZAMAN ÇİZELGESİ|TIMELINE/ },
  { path: '/force', heading: /GÜÇ KASASI|FORCE LORE VAULT/ },
  { path: '/watch-guide', heading: /İZLEME REHBERİ|WATCH GUIDE/ },
  { path: '/hangar', heading: /HANGARI|STARSHIP HANGAR/ },
]

for (const route of routes) {
  test(`${route.path} deep-links into its own page`, async ({ page }) => {
    await page.goto(route.path)
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })
}

test('a record links the Wookieepedia article it was written from', async ({ page }) => {
  await page.goto('/hangar')
  const citation = page.getByRole('link', { name: /Millennium Falcon ↗/ })
  await expect(citation).toHaveAttribute(
    'href',
    'https://starwars.fandom.com/wiki/Millennium_Falcon',
  )
})

test('the archive menu reaches a route without touching the map', async ({ page }) => {
  await page.goto('/hangar')
  await page.getByRole('button', { name: /Arşiv|Archive/ }).click()
  await page.getByRole('button', { name: /İzleme Rehberi|Watch Guide/ }).click()

  await expect(page).toHaveURL(/\/watch-guide/)
})

test('a tool panel opens as a dialog and Escape closes it', async ({ page }) => {
  await page.goto('/hangar')
  await page.getByRole('button', { name: /Araçlar|Tools/ }).click()
  await page.getByRole('button', { name: /Aurebesh/ }).click()

  const dialog = page.getByRole('dialog', { name: /AUREBESH/ })
  await expect(dialog).toBeVisible()
  // focus starts inside the panel, so the keyboard cannot end up on the page
  // behind it
  await expect(dialog.getByRole('button', { name: /Kapat|Close/ })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

// The four lore routes shipped inside a `min-h-screen` wrapper while `#root` is
// a fixed-height, overflow-hidden box: the wrapper grew past the root, so every
// record below the first screen was clipped and unreachable. Nothing in the
// unit suite can see that — jsdom has no layout — so it is asserted here.
test('the chronology scrolls to its last event', async ({ page }) => {
  await page.goto('/timeline')

  const last = page.getByRole('heading', { name: /Exegol/ })
  await last.scrollIntoViewIfNeeded()
  await expect(last).toBeInViewport()
})

test('the era rail follows the reader down the chronology', async ({ page }) => {
  await page.goto('/timeline')
  const rail = page.getByRole('navigation', { name: /Dönemler|Eras/ })

  await expect(rail.locator('[aria-current="true"]')).toContainText(/Eski Cumhuriyet|Old Republic/)

  await page.getByRole('heading', { name: /Exegol/ }).scrollIntoViewIfNeeded()
  await expect(rail.locator('[aria-current="true"]')).toContainText(
    /Yeni Cumhuriyet|New Republic/,
  )
})

test('four worlds compare side by side from one link', async ({ page }) => {
  // four cold WebGL scenes at once, so the same wide window the other engine
  // routes get
  test.slow()
  await page.goto('/compare?ids=hoth,mustafar,naboo,coruscant')

  // the picker options come from the whole planet index, loaded lazily
  await expect(page.getByRole('combobox')).toHaveCount(4, { timeout: 20_000 })
  await expect(page.locator('canvas')).toHaveCount(4, { timeout: 20_000 })
  await expect(page.getByRole('columnheader', { name: 'Coruscant' })).toBeVisible()
})

test('the Holocron grid walks by row under the arrow keys', async ({ page }) => {
  // jsdom performs no layout, so the row arithmetic is only real here
  await page.goto('/holocron')
  const cards = page.locator('[data-roving-item]')
  await expect(cards.first()).toBeVisible()

  // the whole grid costs one Tab stop: every card but the resting one is
  // pulled out of the tab order
  await expect(page.locator('[data-roving-item][tabindex="0"]').first()).toBeAttached()

  await cards.first().focus()
  const firstTop = await cards.first().evaluate((el) => el.getBoundingClientRect().top)

  await page.keyboard.press('ArrowRight')
  const second = await page.evaluate(() => document.activeElement?.getAttribute('href'))
  expect(second).not.toBeNull()

  await page.keyboard.press('ArrowDown')
  const moved = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    return { href: el.getAttribute('href'), top: el.getBoundingClientRect().top }
  })
  expect(moved.href).not.toBe(second)
  expect(moved.top).toBeGreaterThan(firstTop)

  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/holocron\/planet\//)
})

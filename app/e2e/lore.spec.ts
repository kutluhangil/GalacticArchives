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

import { expect, test } from '@playwright/test'

// Everything below is the returning visitor's view. The first-visit hint is a
// modal-ish panel over the HUD and has its own test at the bottom.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ga-onboarded', '1'))
})

// A deep route loaded cold is the case that breaks when the Vite base or the
// SPA rewrite regress: the HTML resolves but its assets 404 under /planet/.
test('a world deep-links straight into its panel', async ({ page }) => {
  await page.goto('/planet/tatooine')
  // the panel paints before the globe, but building the scene then blocks the
  // main thread for seconds on a two-core CI runner, and a blocked thread
  // answers no queries — hence the same wide window the galaxy routes get
  await expect(page.getByRole('heading', { name: 'TATOOINE' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('R-16')).toBeVisible()
  await expect(page.locator('canvas')).toBeVisible()
})

test('a world canon says little about states the gap instead of hiding it', async ({ page }) => {
  await page.goto('/planet/moraband')
  await expect(page.getByRole('heading', { name: 'MORABAND' })).toBeVisible({ timeout: 20_000 })

  // canon states no diameter, population or government for Moraband
  await expect(page.getByText(/kanonda belirtilmemiş|not stated in canon/)).toHaveCount(3)
  await expect(page.getByRole('link', { name: /Wookieepedia/ })).toHaveAttribute(
    'href',
    'https://starwars.fandom.com/wiki/Moraband',
  )
})

test('the galaxy map boots its WebGL canvas', async ({ page }) => {
  await page.goto('/galaxy')
  await expect(page.locator('canvas')).toBeVisible()
  // the error boundary's panel must not be what we are looking at
  await expect(page.getByText(/TRANSMISSION|BAĞLANTI/i)).toHaveCount(0)
})

// Driven from the landing route on purpose. ⌘K is mounted app-wide in App.tsx,
// but on the WebGL routes under headless software rendering (SwiftShader) the
// engine's animation loop starves React's Suspense reveal, so the palette's
// first open never paints. On real GPU hardware — including `--headed` here —
// it opens on the engine routes too, so this is a harness artifact, not a
// product path worth asserting from an engine route.
test('the command palette finds a world by name', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.keyboard.press('ControlOrMeta+k')
  const search = page.getByPlaceholder(/ara|search/i)
  await expect(search).toBeVisible()

  await search.fill('tatoo')
  await page.getByRole('option', { name: /Tatooine/i }).first().click()

  await expect(page).toHaveURL(/\/planet\/tatooine/)
  await expect(page.getByRole('heading', { name: 'TATOOINE' })).toBeVisible()
})

// The sector is the one grouping the map cannot draw: canon states no sector
// borders, so it lives as a search and filter axis instead of a polygon.
test('the command palette gathers a sector the map cannot draw', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.keyboard.press('ControlOrMeta+k')
  const search = page.getByPlaceholder(/ara|search/i)
  await expect(search).toBeVisible()

  await search.fill('Arkanis sector')
  // no world is called Arkanis; these three are the worlds the sector holds
  for (const world of [/Tatooine/i, /Geonosis/i, /Trask/i]) {
    await expect(page.getByRole('option', { name: world })).toBeVisible()
  }
  await expect(page.getByRole('option', { name: /Hoth/i })).toHaveCount(0)
})

test('the Legends layer adds the Old Republic era to the timeline', async ({ page }) => {
  await page.goto('/galaxy')
  const oldRepublic = page.getByRole('button', { name: /Eski Cumhuriyet|Old Republic/ })
  await expect(oldRepublic).toHaveCount(0)

  await page.getByRole('button', { name: /Ayarlar|Settings/ }).click()
  await page.getByRole('switch', { name: /Legends/ }).click()

  await expect(oldRepublic).toBeVisible()
})

test('the course plotter walks the lanes between two worlds', async ({ page }) => {
  await page.goto('/galaxy')
  await page.getByRole('button', { name: /Rota çiz|Plot a course/ }).click()

  await page.getByRole('combobox', { name: /^(Nereden|From)$/ }).selectOption('Coruscant')
  await page.getByRole('combobox', { name: /^(Nereye|To)$/ }).selectOption('Ryloth')

  // Coruscant and Ryloth both sit on the Corellian Run, so the course is that
  // lane walked end to end — jumps, parsecs and every stop in between
  const itinerary = page.getByRole('list', { name: /Rota çiz|Plot a course/ })
  await expect(page.getByText(/\d+ (sıçrama|jumps) ·/)).toBeVisible()
  await expect(itinerary.getByText('Christophsis')).toBeVisible()
  await expect(itinerary.getByText(/Corellia Koşusu|Corellian Run/).first()).toBeVisible()

  // an archive world on the course opens its record
  await itinerary.getByRole('button', { name: 'Ryloth', exact: true }).click()
  await expect(page).toHaveURL(/\/planet\/ryloth/)
})

test('hyperlanes can be switched off', async ({ page }) => {
  await page.goto('/galaxy')
  await page.getByRole('button', { name: /Ayarlar|Settings/ }).click()

  const lanes = page.getByRole('switch', { name: /Hiperuzay|Hyperlanes/ })
  await expect(lanes).toHaveAttribute('aria-checked', 'true')
  await lanes.click()
  await expect(lanes).toHaveAttribute('aria-checked', 'false')

  await page.reload()
  await page.getByRole('button', { name: /Ayarlar|Settings/ }).click()
  await expect(page.getByRole('switch', { name: /Hiperuzay|Hyperlanes/ })).toHaveAttribute(
    'aria-checked',
    'false',
  )
})

test('a starred world survives a reload', async ({ page }) => {
  // the only test that pays the cold scene build twice — once on arrival and
  // once after the reload — which outruns the 30s per-test budget on CI
  test.slow()
  await page.goto('/planet/hoth')
  await page.getByRole('button', { name: /Favorilere ekle|Add to favorites/ }).click()

  await page.reload()
  // the reload pays the cold scene build a second time
  await expect(
    page.getByRole('button', { name: /Favorilerden çıkar|Remove from favorites/ }),
  ).toBeVisible({ timeout: 20_000 })
})

test('a hyperlane deep-links into its own panel', async ({ page }) => {
  await page.goto('/galaxy?lane=perlemian-trade-route')

  const panel = page.getByRole('region', { name: /Hiperuzay hattı|Hyperlane/ })
  // the galaxy route cold-loads three.js, and under a full parallel run that
  // first paint outruns the default 5s expect timeout
  await expect(panel.getByRole('heading', { name: /Perlemian/ })).toBeVisible({ timeout: 20_000 })
  await expect(panel.getByText(/\d+ (durak|stops) ·/)).toBeVisible()

  // an archive world on the lane opens its record; the charted stops with no
  // record here are listed, but are not reachable
  await expect(panel.getByRole('button', { name: 'Alsakan', exact: true })).toHaveCount(0)
  await panel.getByRole('button', { name: 'Coruscant', exact: true }).click()
  await expect(page).toHaveURL(/\/planet\/coruscant/)
})

test('flying a lane starts a tour at its first stop', async ({ page }) => {
  // walks two WebGL routes in one test — the galaxy scene, then a world's —
  // which has outrun the default budget on a two-core runner
  test.slow()
  await page.goto('/galaxy?lane=corellian-run')
  await page.getByRole('button', { name: /Bu hattı uç|Fly this lane/ }).click()

  // the player owns the route: it navigates to the first stop by itself
  await expect(page).toHaveURL(/\/planet\/coruscant/)
  const player = page.getByRole('region', { name: /Corellia Koşusu|Corellian Run/ })
  await expect(player.getByText('1 / 4')).toBeVisible()

  await player.getByRole('button', { name: /İleri|Next/ }).click()
  await expect(player.getByText('2 / 4')).toBeVisible()
  await expect(page).toHaveURL(/\/planet\/corellia/)
})

test('the keyboard lane list selects a lane without a pointer', async ({ page }) => {
  // the galaxy route cold-builds the WebGL scene, which under a full parallel
  // run has taken past the default budget on this machine
  test.slow()
  await page.goto('/galaxy')
  const entry = page
    .getByRole('navigation', { name: /Hiperuzay hatları|Hyperlanes/ })
    .getByRole('button', { name: /Corellia Koşusu|Corellian Run/ })
  await expect(entry).toBeAttached({ timeout: 20_000 })
  await entry.focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/lane=corellian-run/)
  await expect(page.getByRole('region', { name: /Hiperuzay hattı|Hyperlane/ })).toBeVisible({
    timeout: 20_000,
  })
})

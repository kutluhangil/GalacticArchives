import { expect, test } from '@playwright/test'

test('the front door renders its wordmark and both entrances', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/GALACTIC ARCHIVES/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ARCHIVES')
  await expect(page.getByRole('link', { name: /GALAKS|ATLAS|GALAXY/i }).first()).toBeVisible()
})

test('the language switch flips the chrome copy', async ({ page }) => {
  await page.goto('/')
  const tagline = page.getByText('Çok uzak bir galaksinin atlası')
  await expect(tagline).toBeVisible()

  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByText('An atlas of a galaxy far, far away')).toBeVisible()
})

test('boots with no console or page errors', async ({ page }) => {
  const problems: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(problems).toEqual([])
})

// This used to assert the opposite: the catch-all route bounced every unknown
// address to the landing page, which told the reader their address was fine and
// answered a crawler with a healthy 200 on a record that does not exist.
test('an unknown route says so instead of bouncing to the front door', async ({ page }) => {
  await page.goto('/this-sector-is-uncharted')

  await expect(page).toHaveURL(/\/this-sector-is-uncharted/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    /NO SUCH RECORD|BÖYLE BİR KAYIT YOK/i,
  )
  // the address the reader asked for is shown back to them
  await expect(page.getByText('/this-sector-is-uncharted')).toBeVisible()

  // and the way back is a link they choose, not a silent redirect
  await page.getByRole('link', { name: /Galaksiye dön|Back to the galaxy/i }).click()
  await expect(page).toHaveURL(/\/galaxy/)
})

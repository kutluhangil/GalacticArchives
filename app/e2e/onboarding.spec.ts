import { expect, test } from '@playwright/test'

// Kept out of atlas.spec.ts: every test there arrives as a returning visitor,
// while this one needs the untouched first-visit storage.
test('the first-visit hint shows once and stays dismissed', async ({ page }) => {
  await page.goto('/galaxy')

  const hint = page.getByRole('dialog', { name: /Arşivi keşfet|Explore the archive/i })
  await expect(hint).toBeVisible()
  await hint.getByRole('button', { name: /Anladım|Got it/ }).click()
  await expect(hint).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

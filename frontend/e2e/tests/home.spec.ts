import { test, expect } from '@playwright/test'

test('home loads and shows feed', async ({ page, baseURL }) => {
  await page.goto('/')
  await expect(page.locator('h1, h2')).toHaveCountGreaterThan(0)
  // check for at least the feed container
  await expect(page.locator('section')).toBeVisible()
})

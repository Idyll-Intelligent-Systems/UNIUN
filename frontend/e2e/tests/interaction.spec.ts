import { test, expect } from '@playwright/test'

test('create post and like persists', async ({ page, request }) => {
  const apiBase = process.env.E2E_API_BASE || 'http://localhost:4000'
  // register/login a temp user to get token
  const uname = 'e2e_' + Math.random().toString(36).slice(2, 8)
  await request.post(`${apiBase}/api/auth/register`, { data: { username: uname, password: 'pass' } })
  const login = await request.post(`${apiBase}/api/auth/login`, { data: { username: uname, password: 'pass' } })
  expect(login.ok()).toBeTruthy()
  const { token } = await login.json()
  // create a post via backend
  const create = await request.post(`${apiBase}/api/posts`, { data: { title: 'E2E Post', mediaType: 'image' }, headers: { Authorization: `Bearer ${token}` } })
  expect(create.ok()).toBeTruthy()
  const post = await create.json()
  const postId = post.id || (post._id && post._id.toString())
  expect(postId).toBeTruthy()

  // visit home
  await page.goto('/')
  await page.waitForSelector('section')
  const matches = await page.locator('h3', { hasText: 'E2E Post' }).count()
  expect(matches).toBeGreaterThan(0)

  // find the card with our title and click the like button
  const likeBtnTestId = page.locator('[data-testid="like-btn"]').first()
  if (await likeBtnTestId.count()) {
    await likeBtnTestId.click()
  } else {
    const firstCard = page.locator('h3', { hasText: 'E2E Post' }).first()
    await firstCard.locator('xpath=ancestor::div[contains(@class,"p-4")]//div[contains(@class,"gap-4")]//button').first().click()
  }

  // allow a moment for server to process
  await page.waitForTimeout(500)

  // fetch the post via API and assert likes >= 1
  const res = await request.get(`${apiBase}/api/posts`)
  expect(res.ok()).toBeTruthy()
  const posts = await res.json()
  const fresh = posts.find((p: any) => (p.id || (p._id && p._id.toString())) === postId)
  expect(fresh).toBeTruthy()
  expect(fresh.likes).toBeGreaterThanOrEqual(1)
})

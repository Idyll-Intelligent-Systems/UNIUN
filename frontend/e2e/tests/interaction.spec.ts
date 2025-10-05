import { test, expect } from '@playwright/test'

test('create post and like persists', async ({ page, request }) => {
  const apiBase = process.env.E2E_API_BASE || 'http://localhost:4000'
  // create a post via backend
  const create = await request.post(`${apiBase}/api/posts`, { data: { title: 'E2E Post', mediaType: 'image' } })
  expect(create.ok()).toBeTruthy()
  const post = await create.json()
  const postId = post.id || (post._id && post._id.toString())
  expect(postId).toBeTruthy()

  // visit home
  await page.goto('/')
  await page.waitForSelector('section')

  // find the card with our title
  const card = page.locator('h3', { hasText: 'E2E Post' }).first()
  await expect(card).toBeVisible()

  // click the like button inside the card
  const likeButton = card.locator('..').locator('button', { hasText: '❤' }).first()
  await likeButton.click()

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

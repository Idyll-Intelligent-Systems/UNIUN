import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  webServer: {
    command: 'NEXT_PUBLIC_API_URL=http://localhost:4000 next dev -p 3002',
    url: 'http://localhost:3002',
    timeout: 60_000,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
  },
})

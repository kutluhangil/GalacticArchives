// End-to-end suite. It runs against the real production build served by
// `vite preview`, because the properties worth testing here — deep-route
// reloads, chunk splitting, the WebGL routes booting at all — only exist after
// a build.

import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // the landing page plays a 22s opening crawl otherwise; the reduced-motion
    // path is a real, shipped branch, so testing through it is honest
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // headless Chromium falls back to SwiftShader for WebGL; without this
          // the engine routes get a null context
          args: ['--enable-unsafe-swiftshader'],
        },
      },
    },
  ],
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

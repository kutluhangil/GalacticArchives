#!/usr/bin/env node
// Screenshots for docs/screenshots/, taken from the real production build.
//
// The README shows the app; a screenshot that was staged by hand drifts the
// moment the UI moves, and nobody notices. This drives the built app through
// Playwright instead, so a re-run reproduces every frame, and the frames that
// need a click (a tool panel, the relationship graph) say so in one place.
//
// The app renders Turkish on a first visit — no stored language — which is what
// the README is written in, so the frames are Turkish without asking for it.
//
// Usage:
//   npm run build
//   npm run preview -- --port 4173 --strictPort &
//   node scripts/capture-screenshots.mjs [name ...]
//
// Pass names to re-take only those frames.

import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, '..', 'docs', 'screenshots')
const BASE = process.env.BASE_URL ?? 'http://localhost:4173'

/** 1440x900 at 2x, which is what the frames already in the repo were taken at */
const VIEWPORT = { width: 1440, height: 900 }
const SCALE = 2

const FRAMES = [
  {
    name: 'timeline',
    path: '/timeline',
    ready: (page) => page.getByRole('heading', { level: 1 }),
  },
  {
    name: 'force',
    path: '/force',
    ready: (page) => page.getByRole('heading', { level: 1 }),
    // the codes open first; the powers are the sourced part of the page
    setup: (page) => page.getByRole('tab', { name: /YETENEKLER/ }).click(),
  },
  {
    name: 'watch-guide',
    path: '/watch-guide',
    ready: (page) => page.getByRole('heading', { level: 1 }),
  },
  {
    name: 'hangar',
    path: '/hangar',
    ready: (page) => page.getByRole('heading', { level: 1 }),
    // the schematic is the part of the hangar worth showing
    setup: (page) => page.getByRole('button', { name: /Şema Görüntüle/i }).click(),
  },
  {
    name: 'tool-lightsabers',
    path: '/galaxy',
    // the tool panels are lazy-loaded dialogs behind the top bar's Tools menu
    async setup(page) {
      // the map is drawn by SwiftShader here, which needs longer than the load
      // event to put a galaxy behind the panel
      await page.locator('canvas').waitFor()
      await page.waitForTimeout(3000)
      // the first-visit hint is a dialog of its own and would sit in the frame
      const hint = page.getByRole('button', { name: /Anladım|Got it/ })
      if (await hint.isVisible()) await hint.click()
      await page.getByRole('button', { name: /Araçlar/ }).click()
      await page.getByRole('button', { name: /Işın Kılıçları/ }).click()
      await page.getByRole('dialog', { name: /IŞIN|LIGHTSABER/ }).waitFor()
    },
  },
  {
    name: 'relationships',
    path: '/holocron/character/ahsoka-tano',
    // the explorer sits below the record's own text, inside the page's own
    // scroll container — scrollIntoViewIfNeeded stops as soon as the heading is
    // on screen, which leaves the graph itself under the fold
    async setup(page) {
      await page
        .locator('section[aria-label="Arşiv bağlantıları"]')
        .evaluate((el) => el.scrollIntoView({ block: 'center' }))
    },
  },
]

const wanted = process.argv.slice(2)
const frames = wanted.length ? FRAMES.filter((f) => wanted.includes(f.name)) : FRAMES
const unknown = wanted.filter((name) => !FRAMES.some((f) => f.name === name))
if (unknown.length) throw new Error(`no such frame: ${unknown.join(', ')}`)

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  // headless Chromium falls back to SwiftShader for WebGL; without this the map
  // routes photograph as a black rectangle
  args: ['--enable-unsafe-swiftshader'],
})
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: SCALE,
  // the landing page plays a 22s opening crawl otherwise, and the engines have
  // a real reduced-motion branch — the same one the e2e suite drives
  reducedMotion: 'reduce',
})

for (const frame of frames) {
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto(`${BASE}${frame.path}`, { waitUntil: 'networkidle' })
  if (frame.ready) await frame.ready(page).first().waitFor()
  if (frame.setup) await frame.setup(page)
  // let the last transition settle; the app animates panels in
  await page.waitForTimeout(600)
  const file = join(OUT, `${frame.name}.jpg`)
  await page.screenshot({ path: file, type: 'jpeg', quality: 88 })
  await page.close()
  if (errors.length) throw new Error(`${frame.name} raised: ${errors.join(' | ')}`)
  console.log(`captured ${frame.name} -> docs/screenshots/${frame.name}.jpg`)
}

await browser.close()

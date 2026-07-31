// @vitest-environment node
//
// Node, not jsdom: importing vite.config.ts pulls in esbuild, which refuses to
// run against jsdom's cross-realm TextEncoder.
//
// Configuration invariants. These are the settings whose breakage is invisible
// in development and only shows up in production: a wrong Vite base 404s every
// deep route's assets, a missing SPA rewrite 404s the route itself, and a
// loosened CSP is silent until it is exploited.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import viteConfig from '../../vite.config'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')
const readJson = (rel: string) => JSON.parse(read(rel))

describe('vite config', () => {
  it('serves assets from an absolute base', () => {
    // a relative './' base resolves /planet/tatooine's assets to
    // /planet/assets/... — every deep SPA route breaks on reload
    expect(viteConfig.base).toBe('/')
  })

  it('builds workers as ES modules', () => {
    expect(viteConfig.worker?.format).toBe('es')
  })

  it('keeps three.js pinned to its own vendor chunk', () => {
    const manualChunks = viteConfig.build?.rollupOptions?.output
    expect(manualChunks).toBeTruthy()
    const source = read('vite.config.ts')
    expect(source).toContain("return 'three'")
    // the KTX2 transcoder must stay out of the always-loaded three chunk
    expect(source).toContain('KTX2Loader')
  })

  it('keeps the hyperlane data in a chunk the budget can see', () => {
    // routes.json grows with every lane charted; folded into the galaxy route
    // chunk that growth would be invisible to check-bundle-budget.mjs
    expect(read('vite.config.ts')).toContain("return 'routes'")
    expect(read('scripts/check-bundle-budget.mjs')).toContain('routes chunk')
  })
})

describe('vercel deployment config', () => {
  const vercel = readJson('vercel.json')

  it('rewrites every path to the SPA shell', () => {
    expect(vercel.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' })
  })

  const headers: { key: string; value: string }[] = vercel.headers[0].headers
  const header = (key: string) => headers.find((h) => h.key === key)?.value ?? ''

  it('ships a content security policy with the dangerous sources closed', () => {
    const csp = header('Content-Security-Policy')
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("base-uri 'self'")
  })

  it('allows only the wasm form of eval in scripts', () => {
    const scriptSrc = header('Content-Security-Policy')
      .split(';')
      .map((d) => d.trim())
      .find((d) => d.startsWith('script-src'))
    expect(scriptSrc).toBe("script-src 'self' 'wasm-unsafe-eval'")
  })

  it('keeps the transport and sniffing headers', () => {
    expect(header('X-Content-Type-Options')).toBe('nosniff')
    expect(header('X-Frame-Options')).toBe('DENY')
    expect(header('Strict-Transport-Security')).toContain('max-age=')
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })
})

describe('index.html', () => {
  const html = read('index.html')

  it('loads no asset from a third-party host', () => {
    // CSP is default-src 'self'; anything remote would simply be blocked.
    // rel="canonical" is a declaration, not a load, so it is exempt.
    const remote = [...html.matchAll(/<(?:script|link|img)\b[^>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => /(?:src|href)="https?:\/\//.test(tag))
      .filter((tag) => !/rel="canonical"/.test(tag))
    expect(remote).toEqual([])
  })

  it('pulls no webfont from a font CDN', () => {
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
  })

  it('declares the PWA manifest and a theme color', () => {
    expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
    expect(html).toContain('name="theme-color"')
  })

  it('carries the share card metadata the static build fills in', () => {
    expect(html).toContain('property="og:image"')
    expect(html).toContain('name="twitter:card"')
  })
})

describe('web app manifest', () => {
  const manifest = readJson('public/manifest.webmanifest')

  it('is scoped to the site root so deep routes stay in the app', () => {
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
  })

  it('declares both PWA icon sizes plus a maskable one', () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true)
  })
})

describe('package.json', () => {
  const pkg = readJson('package.json')

  it('self-hosts its fonts instead of loading them remotely', () => {
    const deps = Object.keys(pkg.dependencies)
    expect(deps).toContain('@fontsource/barlow-condensed')
    expect(deps).toContain('@fontsource/libre-franklin')
  })

  it('exposes the full verification chain as one script', () => {
    expect(pkg.scripts.verify).toBeTruthy()
    for (const step of ['lint', 'validate', 'test', 'build', 'budget', 'e2e']) {
      expect(pkg.scripts.verify, `verify runs ${step}`).toContain(step)
    }
  })

  it('keeps every test tool in devDependencies', () => {
    for (const tool of ['vitest', '@playwright/test', '@testing-library/react', 'jsdom']) {
      expect(Object.keys(pkg.devDependencies), tool).toContain(tool)
    }
    expect(Object.keys(pkg.dependencies)).not.toContain('vitest')
  })
})

describe('provenance data', () => {
  const sources = readJson('src/data/sources.json')
  const digest = readJson('test/fixtures/lore-digest.json')
  const DIGEST_TO_BODY: Record<string, string> = { 'endor-prime': 'endor' }

  it('records when it was generated and how', () => {
    expect(Date.parse(sources.generatedAt)).not.toBeNaN()
    expect(sources.method).toContain('Wookieepedia')
    expect(sources.notes['global-unverified']).toBeTruthy()
  })

  it('gives every entity an article and a url', () => {
    for (const [id, entry] of Object.entries<{ source: string; url?: string }>(sources.entities)) {
      expect(entry.source, `${id} source`).toMatch(/^wookieepedia:/)
      expect(entry.url, `${id} url`).toMatch(/^https:\/\/starwars\.fandom\.com\/wiki\//)
    }
  })

  it('backs every "unverified" claim with the digest snapshot', () => {
    // an unverified field is a statement about canon; it has to come from the
    // fetched article, not from an author's memory
    for (const [digestId, entry] of Object.entries<{ absent?: string[] }>(digest.planets)) {
      const id = DIGEST_TO_BODY[digestId] ?? digestId
      const claimed = sources.entities[id]?.unverified
      if (!claimed) continue
      expect([...claimed].sort(), `${id}`).toEqual([...(entry.absent ?? [])].sort())
    }
  })

  it('only ever marks the three headline fields as unverified', () => {
    const tracked = new Set(['diameter', 'population', 'government'])
    for (const [id, entry] of Object.entries<{ unverified?: string[] }>(sources.entities)) {
      for (const field of entry.unverified ?? []) {
        expect(tracked.has(field), `${id} unverified "${field}"`).toBe(true)
      }
    }
  })
})

describe('index.html world count', () => {
  it('matches the number of planet files actually shipped', () => {
    const planetCount = readdirSync(join(ROOT, 'src/data/planets')).filter((f) =>
      f.endsWith('.json'),
    ).length
    const claimed = read('index.html').match(/atlas of the Star Wars galaxy: (\d+) worlds/)?.[1]
    expect(Number(claimed)).toBe(planetCount)
  })
})

describe('service worker', () => {
  const sw = read('public/sw.js')

  it('versions its caches so a deploy can evict the old shell', () => {
    expect(sw).toMatch(/const VERSION = '[^']+'/)
  })

  it('precaches the shell and the manifest', () => {
    expect(sw).toContain("'/manifest.webmanifest'")
  })
})

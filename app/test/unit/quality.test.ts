// Quality tiers. `resolvedQuality` caches its auto-detection for the session,
// so every case re-imports the module with a fresh device profile.

import { afterEach, describe, expect, it, vi } from 'vitest'

interface Device {
  cores?: number
  coarsePointer?: boolean
  tauri?: boolean
}

async function loadQuality(device: Device = {}) {
  vi.resetModules()
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    value: device.cores ?? 8,
    configurable: true,
  })
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('coarse') ? !!device.coarsePointer : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  if (device.tauri) {
    ;(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {}
  } else {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__
  }
  return import('../../src/lib/quality')
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__
})

describe('auto detection', () => {
  it('gives a desktop-class machine the high tier', async () => {
    const { resolvedQuality } = await loadQuality({ cores: 12 })
    expect(resolvedQuality()).toBe('high')
  })

  it('gives a coarse-pointer device the low tier', async () => {
    const { resolvedQuality } = await loadQuality({ cores: 12, coarsePointer: true })
    expect(resolvedQuality()).toBe('low')
  })

  it('gives a low-core machine the low tier', async () => {
    const { resolvedQuality } = await loadQuality({ cores: 4 })
    expect(resolvedQuality()).toBe('low')
  })

  it('always gives the packaged desktop app the high tier', async () => {
    const { resolvedQuality } = await loadQuality({ cores: 2, coarsePointer: true, tauri: true })
    expect(resolvedQuality()).toBe('high')
  })

  it('detects once and reuses the answer for the session', async () => {
    const { resolvedQuality } = await loadQuality({ cores: 12 })
    expect(resolvedQuality()).toBe('high')
    // a later pointer change must not re-tier mid-session
    vi.stubGlobal('matchMedia', () => ({ matches: true, media: '', addEventListener: () => {}, removeEventListener: () => {} }))
    expect(resolvedQuality()).toBe('high')
  })
})

describe('explicit override', () => {
  it('wins over detection in both directions', async () => {
    const { setQuality, resolvedQuality } = await loadQuality({ cores: 2, coarsePointer: true })
    setQuality('high')
    expect(resolvedQuality()).toBe('high')
    setQuality('low')
    expect(resolvedQuality()).toBe('low')
  })

  it('hands control back to detection on auto', async () => {
    const { setQuality, resolvedQuality } = await loadQuality({ cores: 12 })
    setQuality('low')
    expect(resolvedQuality()).toBe('low')
    setQuality('auto')
    expect(resolvedQuality()).toBe('high')
  })
})

describe('tier settings', () => {
  it('makes low strictly cheaper than high on every axis', async () => {
    const { setQuality, qualitySettings } = await loadQuality()
    setQuality('low')
    const low = qualitySettings()
    setQuality('high')
    const high = qualitySettings()

    expect(low.maxPixelRatio).toBeLessThan(high.maxPixelRatio)
    expect(low.starCount).toBeLessThan(high.starCount)
    expect(low.planetSegments).toBeLessThan(high.planetSegments)
    expect(low.galaxyStars).toBeLessThan(high.galaxyStars)
    expect(low.bloom).toBe(false)
    expect(high.bloom).toBe(true)
  })
})

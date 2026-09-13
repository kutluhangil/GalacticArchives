// @vitest-environment node
//
// Node, not jsdom: the worker source is read from disk, which needs a file URL
// for import.meta.url.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it } from 'vitest'

// public/sw.js never goes through the bundler, so it is loaded as source and
// run against stand-ins for the service worker globals. That exercises the real
// eviction code rather than a copy of it.
const source = readFileSync(fileURLToPath(new URL('../../public/sw.js', import.meta.url)), 'utf8')

const MB = 1024 * 1024

type StubResponse = {
  ok: boolean
  headers: { get: (name: string) => string | null }
  clone: () => StubResponse
  blob: () => Promise<{ size: number }>
  bytes: number
}

function response(bytes: number, ok = true): StubResponse {
  return {
    ok,
    headers: { get: (name) => (name === 'content-length' ? String(bytes) : null) },
    clone: () => response(bytes, ok),
    blob: async () => ({ size: bytes }),
    bytes,
  }
}

class StubCache {
  entries: { url: string; response: StubResponse }[] = []

  async keys() {
    return this.entries.map((entry) => ({ url: entry.url }))
  }

  async match(request: { url: string }) {
    return this.entries.find((entry) => entry.url === request.url)?.response
  }

  // Mirrors the spec: put deletes any matching record, then appends the new one.
  async put(request: { url: string }, value: StubResponse) {
    this.entries = this.entries.filter((entry) => entry.url !== request.url)
    this.entries.push({ url: request.url, response: value })
  }

  async delete(request: { url: string }) {
    const before = this.entries.length
    this.entries = this.entries.filter((entry) => entry.url !== request.url)
    return this.entries.length < before
  }

  get totalBytes() {
    return this.entries.reduce((sum, entry) => sum + entry.response.bytes, 0)
  }
}

type Handlers = Record<string, (event: unknown) => void>

function bootWorker(fetchImpl: (request: { url: string }) => Promise<StubResponse>) {
  const handlers: Handlers = {}
  const store = new Map<string, StubCache>()
  const caches = {
    open: async (name: string) => {
      const existing = store.get(name)
      if (existing) return existing
      const created = new StubCache()
      store.set(name, created)
      return created
    },
    keys: async () => [...store.keys()],
    delete: async (name: string) => store.delete(name),
    match: async (request: { url: string }) => {
      for (const cache of store.values()) {
        const hit = await cache.match(request)
        if (hit) return hit
      }
      return undefined
    },
  }
  const self = {
    addEventListener: (type: string, handler: (event: unknown) => void) => {
      handlers[type] = handler
    },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
    location: { origin: 'https://archives.test' },
  }
  new Function('self', 'caches', 'fetch', 'Response', source)(self, caches, fetchImpl, {})
  return { handlers, store, caches }
}

async function requestTexture(handlers: Handlers, path: string) {
  const pending: Promise<unknown>[] = []
  let answered: Promise<StubResponse> | undefined
  handlers.fetch({
    request: { url: `https://archives.test${path}`, method: 'GET', mode: 'no-cors' },
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    respondWith: (promise: Promise<StubResponse>) => {
      answered = promise
    },
  })
  const served = await answered
  await Promise.all(pending)
  return served
}

describe('service worker texture cache', () => {
  let handlers: Handlers
  let store: Map<string, StubCache>
  let network: string[]

  beforeEach(() => {
    network = []
    const booted = bootWorker(async (request) => {
      network.push(request.url)
      return response(1.5 * MB)
    })
    handlers = booted.handlers
    store = booted.store
  })

  const textures = () => store.get('ga-v4-textures') as StubCache

  it('serves a texture from the network and keeps it for the next request', async () => {
    await requestTexture(handlers, '/textures/planets/hoth/albedo-4k.ktx2')
    expect(textures().entries.map((entry) => entry.url)).toEqual([
      'https://archives.test/textures/planets/hoth/albedo-4k.ktx2',
    ])

    await requestTexture(handlers, '/textures/planets/hoth/albedo-4k.ktx2')
    expect(network).toHaveLength(1)
  })

  it('holds the cache under its byte budget instead of growing without end', async () => {
    for (let i = 0; i < 60; i += 1) {
      await requestTexture(handlers, `/textures/planets/world-${i}/albedo-4k.ktx2`)
    }

    expect(textures().totalBytes).toBeLessThanOrEqual(64 * MB)
    expect(textures().entries.length).toBeLessThan(60)
    // Eviction takes the oldest first.
    expect(textures().entries.at(-1)?.url).toContain('world-59')
    expect(textures().entries.some((entry) => entry.url.includes('world-0'))).toBe(false)
  })

  it('evicts the least recently used texture, not the least recently fetched', async () => {
    for (let i = 0; i < 40; i += 1) {
      await requestTexture(handlers, `/textures/planets/world-${i}/albedo-4k.ktx2`)
    }
    await requestTexture(handlers, '/textures/planets/world-0/albedo-4k.ktx2')
    for (let i = 40; i < 60; i += 1) {
      await requestTexture(handlers, `/textures/planets/world-${i}/albedo-4k.ktx2`)
    }

    expect(textures().entries.some((entry) => entry.url.includes('world-0/'))).toBe(true)
    expect(textures().entries.some((entry) => entry.url.includes('world-1/'))).toBe(false)
  })

  it('does not cache a texture the server refused', async () => {
    const booted = bootWorker(async () => response(0, false))
    await requestTexture(booted.handlers, '/textures/planets/hoth/albedo-4k.ktx2')
    expect(booted.store.get('ga-v4-textures')?.entries ?? []).toHaveLength(0)
  })
})

describe('service worker versioning', () => {
  it('drops caches from an earlier version on activate', async () => {
    const { handlers, store, caches } = bootWorker(async () => response(0))
    await caches.open('ga-v3-assets')
    await caches.open('ga-v4-assets')
    const pending: Promise<unknown>[] = []
    handlers.activate({ waitUntil: (promise: Promise<unknown>) => pending.push(promise) })
    await Promise.all(pending)

    expect([...store.keys()]).toEqual(['ga-v4-assets'])
  })
})

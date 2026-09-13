// App-shell service worker. Hashed build assets are immutable, so they are
// cached forever; navigations go to the network first so a deploy is picked up
// on the next load, with the cached shell as the offline fallback.

const VERSION = 'ga-v4'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
// Planet textures live apart from the other assets because they are the only
// unbounded set: 90 worlds x three mip levels, up to ~1.5 MB per 4K albedo.
// Caching all of them would push past the origin's storage quota, at which
// point the browser rejects writes — so this bucket keeps a byte budget and
// evicts least-recently-used entries once it is exceeded.
const TEXTURES = `${VERSION}-textures`
const TEXTURE_BUDGET_BYTES = 64 * 1024 * 1024

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(['/', '/manifest.webmanifest'])),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// Cache.keys() lists entries in insertion order, and Cache.put() on an existing
// request removes the old record before appending the new one. Re-putting a hit
// therefore moves it to the end, which makes the key order a recency order.
async function touchTexture(cache, request, response) {
  const keys = await cache.keys()
  if (keys.length > 0 && keys[keys.length - 1].url === request.url) return
  await cache.put(request, response)
}

async function entrySize(cache, request) {
  const hit = await cache.match(request)
  if (!hit) return 0
  const declared = hit.headers.get('content-length')
  if (declared !== null) return Number(declared)
  // No Content-Length (a chunked or opaque-ish response): measure the body
  // rather than guess, so the budget stays an actual byte count.
  return (await hit.blob()).size
}

async function evictTextures(cache) {
  const keys = await cache.keys()
  const sizes = await Promise.all(keys.map((key) => entrySize(cache, key)))
  let total = sizes.reduce((sum, size) => sum + size, 0)
  for (let i = 0; i < keys.length && total > TEXTURE_BUDGET_BYTES; i += 1) {
    await cache.delete(keys[i])
    total -= sizes[i]
  }
}

async function serveTexture(event, request) {
  const cache = await caches.open(TEXTURES)
  const hit = await cache.match(request)
  if (hit) {
    event.waitUntil(touchTexture(cache, request, hit.clone()))
    return hit
  }
  const response = await fetch(request)
  if (!response.ok) return response
  const copy = response.clone()
  event.waitUntil(cache.put(request, copy).then(() => evictTextures(cache)))
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only the root navigation refreshes the shell. Every other
          // navigation answers with a different document — a pre-rendered world
          // page, or 404.html for an address that is not in the archive — and
          // storing one of those under '/' would hand it back as the offline
          // shell for the whole app.
          if (url.pathname === '/' && response.ok) {
            const copy = response.clone()
            caches.open(SHELL).then((cache) => cache.put('/', copy))
          }
          return response
        })
        .catch(() => caches.match('/').then((hit) => hit ?? Response.error())),
    )
    return
  }

  if (url.pathname.startsWith('/textures/')) {
    event.respondWith(serveTexture(event, request))
    return
  }

  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/basis/') ||
    url.pathname.startsWith('/cards/') ||
    url.pathname.startsWith('/portraits/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(ASSETS).then((cache) => cache.put(request, copy))
            return response
          }),
      ),
    )
  }
})

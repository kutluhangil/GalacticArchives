// App-shell service worker. Hashed build assets are immutable, so they are
// cached forever; navigations go to the network first so a deploy is picked up
// on the next load, with the cached shell as the offline fallback.

const VERSION = 'ga-v3'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`

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

  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/textures/') ||
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

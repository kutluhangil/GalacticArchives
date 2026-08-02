// Data router: routes hang under the App layout so navigations flow through
// react-router's transition machinery, which is what enables `viewTransition`
// on <Link> (the declarative <Routes> API does not wire it up).

import { lazy, type ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import App from './App'

const RELOAD_KEY = 'ga-chunk-reload'
/** don't auto-reload more than once inside this window (ms) */
const RELOAD_COOLDOWN = 10_000

/**
 * A failed dynamic import almost always means a new deploy replaced the hashed
 * chunks while this tab was open, so the old chunk URL now 404s. Reload once —
 * the fresh index.html points at the current chunks. A timestamp guard caps it
 * at one reload per cooldown, so a genuine, persistent failure (offline, real
 * bug) falls through to the ErrorBoundary instead of looping.
 */
function lazyWithReload<T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? '0')
      if (Date.now() - last > RELOAD_COOLDOWN) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
        window.location.reload()
        return new Promise<{ default: T }>(() => {}) // never resolves; reload wins
      }
      throw err
    }),
  )
}

// Route-level splitting keeps three.js out of the landing and Holocron chunks.
const Landing = lazyWithReload(() => import('./pages/Landing'))
const GalaxyView = lazyWithReload(() => import('./pages/GalaxyView'))
const PlanetView = lazyWithReload(() => import('./pages/PlanetView'))
const SystemView = lazyWithReload(() => import('./pages/SystemView'))
const Compare = lazyWithReload(() => import('./pages/Compare'))
const Holocron = lazyWithReload(() => import('./pages/Holocron'))
const HolocronPlanet = lazyWithReload(() => import('./pages/HolocronPlanet'))
const HolocronCharacter = lazyWithReload(() => import('./pages/HolocronCharacter'))
const Timeline = lazyWithReload(() => import('./pages/Timeline'))

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/galaxy', element: <GalaxyView /> },
      { path: '/planet/:id', element: <PlanetView /> },
      { path: '/system/:id', element: <SystemView /> },
      { path: '/compare', element: <Compare /> },
      { path: '/timeline', element: <Timeline /> },
      { path: '/holocron', element: <Holocron /> },
      { path: '/holocron/planet/:id', element: <HolocronPlanet /> },
      { path: '/holocron/character/:id', element: <HolocronCharacter /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])


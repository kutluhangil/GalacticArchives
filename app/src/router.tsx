// Data router: routes hang under the App layout so navigations flow through
// react-router's transition machinery, which is what enables `viewTransition`
// on <Link> (the declarative <Routes> API does not wire it up).

import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import App from './App'

// Route-level splitting keeps three.js out of the landing and Holocron chunks.
const Landing = lazy(() => import('./pages/Landing'))
const GalaxyView = lazy(() => import('./pages/GalaxyView'))
const PlanetView = lazy(() => import('./pages/PlanetView'))
const SystemView = lazy(() => import('./pages/SystemView'))
const Compare = lazy(() => import('./pages/Compare'))
const Holocron = lazy(() => import('./pages/Holocron'))
const HolocronPlanet = lazy(() => import('./pages/HolocronPlanet'))
const HolocronCharacter = lazy(() => import('./pages/HolocronCharacter'))

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/galaxy', element: <GalaxyView /> },
      { path: '/planet/:id', element: <PlanetView /> },
      { path: '/system/:id', element: <SystemView /> },
      { path: '/compare', element: <Compare /> },
      { path: '/holocron', element: <Holocron /> },
      { path: '/holocron/planet/:id', element: <HolocronPlanet /> },
      { path: '/holocron/character/:id', element: <HolocronCharacter /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

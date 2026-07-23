import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import TransitionVeil from './components/TransitionVeil'
import TourPlayer from './components/TourPlayer'
import CommandPaletteHost from './components/CommandPaletteHost'
import { setQuality } from './lib/quality'
import { t } from './lib/ui-strings'
import { useApp } from './state/app'

// Route-level splitting keeps three.js out of the landing and Holocron chunks.
const Landing = lazy(() => import('./pages/Landing'))
const GalaxyView = lazy(() => import('./pages/GalaxyView'))
const PlanetView = lazy(() => import('./pages/PlanetView'))
const SystemView = lazy(() => import('./pages/SystemView'))
const Compare = lazy(() => import('./pages/Compare'))
const Holocron = lazy(() => import('./pages/Holocron'))
const HolocronPlanet = lazy(() => import('./pages/HolocronPlanet'))
const HolocronCharacter = lazy(() => import('./pages/HolocronCharacter'))

function RouteFallback() {
  const lang = useApp((s) => s.lang)
  return (
    <div className="flex h-full w-full items-center justify-center bg-space">
      <div className="animate-pulse text-[13px] tracking-[0.3em] text-holo-cyan">
        {t('loading', lang)}
      </div>
    </div>
  )
}

export default function App() {
  const lang = useApp((s) => s.lang)
  const quality = useApp((s) => s.quality)

  // keep the document language in sync for screen readers and hyphenation
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // the engines read quality directly, so mirror the stored preference in
  useEffect(() => {
    setQuality(quality)
  }, [quality])

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/galaxy" element={<GalaxyView />} />
          <Route path="/planet/:id" element={<PlanetView />} />
          <Route path="/system/:id" element={<SystemView />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/holocron" element={<Holocron />} />
          <Route path="/holocron/planet/:id" element={<HolocronPlanet />} />
          <Route path="/holocron/character/:id" element={<HolocronCharacter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <TourPlayer />
      <TransitionVeil />
      <CommandPaletteHost />
    </>
  )
}

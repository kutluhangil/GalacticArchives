import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import HyperspaceOverlay from './components/HyperspaceOverlay'
import CommandPaletteHost from './components/CommandPaletteHost'
import EraFade from './components/EraFade'
import { audio } from './lib/audio'
import { setQuality } from './lib/quality'
import { t } from './lib/ui-strings'
import { useApp } from './state/app'

// Route-level splitting keeps three.js out of the landing and Holocron chunks.
const Landing = lazy(() => import('./pages/Landing'))
const GalaxyView = lazy(() => import('./pages/GalaxyView'))
const PlanetView = lazy(() => import('./pages/PlanetView'))
const SystemView = lazy(() => import('./pages/SystemView'))
const Holocron = lazy(() => import('./pages/Holocron'))
const HolocronPlanet = lazy(() => import('./pages/HolocronPlanet'))
const HolocronCharacter = lazy(() => import('./pages/HolocronCharacter'))
const Home = lazy(() => import('./pages/Home'))

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

  // browsers only allow audio to start from a gesture
  useEffect(() => {
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/galaxy" element={<GalaxyView />} />
          <Route path="/planet/:id" element={<PlanetView />} />
          <Route path="/system/:id" element={<SystemView />} />
          <Route path="/holocron" element={<Holocron />} />
          <Route path="/holocron/planet/:id" element={<HolocronPlanet />} />
          <Route path="/holocron/character/:id" element={<HolocronCharacter />} />
          {/* original LEO LIVE satellite demo, kept as an engineering reference */}
          <Route path="/legacy" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <HyperspaceOverlay />
      <CommandPaletteHost />
      <EraFade />
    </>
  )
}

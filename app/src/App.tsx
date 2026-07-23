import { Routes, Route, Navigate } from 'react-router'
import PlanetView from './pages/PlanetView'
import SystemView from './pages/SystemView'
import GalaxyView from './pages/GalaxyView'
import Home from './pages/Home'
import HyperspaceOverlay from './components/HyperspaceOverlay'
import CommandPalette from './components/CommandPalette'
import EraFade from './components/EraFade'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/galaxy" replace />} />
        <Route path="/galaxy" element={<GalaxyView />} />
        <Route path="/planet/:id" element={<PlanetView />} />
        <Route path="/system/:id" element={<SystemView />} />
        {/* original LEO LIVE satellite demo, kept as an engineering reference */}
        <Route path="/legacy" element={<Home />} />
        <Route path="*" element={<Navigate to="/galaxy" replace />} />
      </Routes>
      <HyperspaceOverlay />
      <CommandPalette />
      <EraFade />
    </>
  )
}

import { Routes, Route, Navigate } from 'react-router'
import PlanetView from './pages/PlanetView'
import SystemView from './pages/SystemView'
import Home from './pages/Home'
import HyperspaceOverlay from './components/HyperspaceOverlay'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/planet/tatooine" replace />} />
        <Route path="/planet/:id" element={<PlanetView />} />
        <Route path="/system/:id" element={<SystemView />} />
        {/* original LEO LIVE satellite demo, kept as an engineering reference */}
        <Route path="/legacy" element={<Home />} />
        <Route path="*" element={<Navigate to="/planet/tatooine" replace />} />
      </Routes>
      <HyperspaceOverlay />
    </>
  )
}

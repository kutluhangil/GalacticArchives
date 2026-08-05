// Owns the mount point for the guided-tour player. The player itself is the
// single heaviest passenger on first paint that nobody asked for: it reaches
// lib/lore for names, which statically pulls the station, era, region, faction
// and production tables, and it carries the authored itineraries and the lane
// tour loader with it. None of that has work to do until a tour is actually
// running, so it loads the first time one starts — the same trade the ⌘K
// palette makes in CommandPaletteHost.

import { lazy, Suspense } from 'react'
import { useApp } from '../state/app'

const TourPlayer = lazy(() => import('./TourPlayer'))

export default function TourPlayerHost() {
  const tour = useApp((s) => s.tour)
  if (!tour) return null
  return (
    <Suspense fallback={null}>
      <TourPlayer />
    </Suspense>
  )
}

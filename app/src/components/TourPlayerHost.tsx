// Owns the mount point for the guided-tour player. The player itself is the
// single heaviest passenger on first paint that nobody asked for: it reaches
// lib/lore for names, which statically pulls the station, era, region, faction
// and production tables, and it carries the authored itineraries and the lane
// tour loader with it. None of that has work to do until a tour is actually
// running, so it loads the first time one starts.
//
// The load is an effect and a state update rather than `lazy` + `<Suspense>`.
// Suspending on the import hands the mount to React's retry scheduling, and
// that retry can arrive arbitrarily late on a thread that is busy drawing a
// galaxy: in headless Chromium, where the map renders through a software
// rasteriser, the module arrived and the player still never mounted — starting
// a tour did nothing at all, with no error anywhere. Resolving the import here
// keeps the chunk split and makes the mount an ordinary render.

import { useEffect, useState, type ComponentType } from 'react'
import { useApp } from '../state/app'

export default function TourPlayerHost() {
  const tour = useApp((s) => s.tour)
  const [Player, setPlayer] = useState<ComponentType | null>(null)

  useEffect(() => {
    if (!tour || Player) return
    let live = true
    void import('./TourPlayer').then((mod) => {
      if (live) setPlayer(() => mod.default)
    })
    return () => {
      live = false
    }
  }, [tour, Player])

  if (!tour || !Player) return null
  return <Player />
}

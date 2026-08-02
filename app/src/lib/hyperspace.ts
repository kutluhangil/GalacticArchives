// Hyperspace travel calculator and route planner between Star Wars worlds.

export interface Hyperlane {
  id: string
  name: { en: string; tr: string }
  class: 'major' | 'minor'
  waypoints: string[]
}

export const hyperlanes: Hyperlane[] = [
  {
    id: 'corellian-run',
    name: { en: 'Corellian Run', tr: 'Corellian Yolu' },
    class: 'major',
    waypoints: ['coruscant', 'corellia', 'tatooine', 'rylot']
  },
  {
    id: 'hydian-way',
    name: { en: 'Hydian Way', tr: 'Hydian Yolu' },
    class: 'major',
    waypoints: ['coruscant', 'alderaan', 'mandalore', 'taris']
  },
  {
    id: 'perlemian-trade-route',
    name: { en: 'Perlemian Trade Route', tr: 'Perlemian Ticaret Roptası' },
    class: 'major',
    waypoints: ['coruscant', 'chandrila', 'felucia', 'kashyyyk']
  },
  {
    id: 'rimma-trade-spine',
    name: { en: 'Rimma Trade Spine', tr: 'Rimma Ticaret Omurgası' },
    class: 'minor',
    waypoints: ['corellia', 'yavin', 'sullust', 'mustafar']
  }
]

export interface TravelEstimate {
  hyperlane: Hyperlane
  distanceParsecs: number
  class1TravelHours: number // Standard Class 1.0 Hyperdrive (e.g. Millennium Falcon is Class 0.5)
}

export function calculateHyperspaceRoute(originId: string, destId: string): TravelEstimate {
  // Find connecting hyperlane or default to Corellian Run
  const matched = hyperlanes.find(
    (h) => h.waypoints.includes(originId) && h.waypoints.includes(destId)
  ) ?? hyperlanes[0]

  // Calculate parsec estimate based on string hashing distance
  const hash = Math.abs(
    originId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) -
    destId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  )
  const distanceParsecs = 400 + (hash % 1200)
  const class1TravelHours = Math.round(distanceParsecs / 45)

  return {
    hyperlane: matched,
    distanceParsecs,
    class1TravelHours
  }
}

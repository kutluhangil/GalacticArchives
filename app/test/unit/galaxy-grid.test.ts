// Galactic Atlas grid -> disk placement. The map is only readable if every
// world lands somewhere deliberate, so the data-driven cases below guard the
// placement rule in GalaxyView (MANUAL_POS ?? gridToPos ?? origin).

import { describe, expect, it } from 'vitest'
import { GALAXY_R, MANUAL_POS, gridToPos } from '../../src/lib/engine/galaxy-engine'
import { loadAllPlanets, loadBody } from '../../src/lib/lore'

const DISK_LIMIT = 0.95 * GALAXY_R

describe('gridToPos', () => {
  it('is pure and deterministic', () => {
    expect(gridToPos('R-16')).toEqual(gridToPos('R-16'))
  })

  it('places Tatooine (R-16) in the south-east quadrant', () => {
    const { x, z } = gridToPos('R-16')
    expect(x).toBeCloseTo(11.818, 3)
    expect(z).toBeCloseTo(9.524, 3)
  })

  it('maps letters west to east and numbers north to south', () => {
    expect(gridToPos('B-11').x).toBeLessThan(gridToPos('K-11').x)
    expect(gridToPos('K-11').x).toBeLessThan(gridToPos('U-11').x)
    expect(gridToPos('L-2').z).toBeLessThan(gridToPos('L-11').z)
    expect(gridToPos('L-11').z).toBeLessThan(gridToPos('L-20').z)
  })

  it('puts the mid grid cell near the galactic core', () => {
    const { x, z } = gridToPos('L-11')
    expect(Math.hypot(x, z)).toBeLessThan(0.05 * GALAXY_R)
  })

  it('clamps corner cells onto the disk edge instead of off it', () => {
    for (const grid of ['A-1', 'V-1', 'A-21', 'V-21']) {
      const { x, z } = gridToPos(grid)
      expect(Math.hypot(x, z), grid).toBeCloseTo(DISK_LIMIT, 6)
    }
  })

  it('keeps every authored coordinate inside the disk', async () => {
    const planets = await loadAllPlanets()
    const withCoords = planets.filter((p) => p.coordinates)
    expect(withCoords.length).toBeGreaterThan(70)
    for (const planet of withCoords) {
      const { x, z } = gridToPos(planet.coordinates!)
      expect(Number.isFinite(x) && Number.isFinite(z), `${planet.id} finite`).toBe(true)
      expect(Math.hypot(x, z), `${planet.id} radius`).toBeLessThanOrEqual(DISK_LIMIT + 1e-9)
    }
  })
})

describe('galaxy node placement', () => {
  it('gives every planet either a grid coordinate or a hand-placed spot', async () => {
    const planets = await loadAllPlanets()
    // a world with neither silently stacks on the galactic core at (0,0)
    const unplaced = planets.filter((p) => !p.coordinates && !MANUAL_POS[p.id]).map((p) => p.id)
    expect(unplaced).toEqual([])
  })

  it('points every MANUAL_POS entry at a body that exists', async () => {
    for (const id of Object.keys(MANUAL_POS)) {
      await expect(loadBody(id), id).resolves.toBeTruthy()
    }
  })

  it('keeps the R-5 Sith worlds from stacking on one node', async () => {
    // Moraband (canon) shares grid R-5 with the Legends worlds Korriban and
    // Dromund Kaas; MANUAL_POS pulls the latter two apart
    const moraband = await loadBody('moraband')
    expect(moraband.coordinates).toBe('R-5')
    const spots = [
      gridToPos(moraband.coordinates!),
      MANUAL_POS.korriban,
      MANUAL_POS['dromund-kaas'],
    ]
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const gap = Math.hypot(spots[i].x - spots[j].x, spots[i].z - spots[j].z)
        expect(gap, `pair ${i}/${j}`).toBeGreaterThan(0.5)
      }
    }
  })

  it('parks Peridea outside the main disk as a separate islet', () => {
    expect(Math.hypot(MANUAL_POS.peridea.x, MANUAL_POS.peridea.z)).toBeGreaterThan(GALAXY_R)
  })
})

import { describe, expect, it } from 'vitest'
import starshipsJson from '../../src/data/starships.json'
import type { Starship } from '../../src/types/lore'

describe('Cockpit HUD & Flight Telemetry', () => {
  const ships = starshipsJson as Starship[]

  it('has valid flight telemetry and armament metrics on all starships', () => {
    for (const ship of ships) {
      expect(ship.id).toBeTruthy()
      expect(ship.names.en).toBeTruthy()
      expect(ship.model).toBeTruthy()
      if (ship.sublightMGLT) {
        expect(ship.sublightMGLT).toBeGreaterThan(0)
        expect(ship.sublightMGLT).toBeLessThanOrEqual(150)
      }
      if (ship.maxSpeed) {
        expect(ship.maxSpeed.length).toBeGreaterThan(0)
      }
    }
  })

  it('verifies fighter and capital ships have appropriate telemetry profiles', () => {
    const xwing = ships.find((s) => s.id === 't-65b-x-wing')
    expect(xwing).toBeDefined()
    expect(xwing?.sublightMGLT).toBe(100)
    expect(xwing?.hyperdriveRating).toBe('Class 1.0')

    const falcon = ships.find((s) => s.id === 'millennium-falcon')
    expect(falcon).toBeDefined()
    expect(falcon?.sublightMGLT).toBe(75)
    expect(falcon?.hyperdriveRating).toBe('Class 0.5 (Modified)')
  })
})

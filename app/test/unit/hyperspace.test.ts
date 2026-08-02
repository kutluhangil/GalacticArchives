import { describe, expect, it } from 'vitest'
import { calculateHyperspaceRoute, hyperlanes } from '../../src/lib/hyperspace'

describe('Hyperspace Route Calculator', () => {
  it('defines major hyperlanes', () => {
    expect(hyperlanes.length).toBeGreaterThanOrEqual(4)
    expect(hyperlanes.some((h) => h.id === 'corellian-run')).toBe(true)
  })

  it('calculates travel distance and time between origin and destination', () => {
    const route = calculateHyperspaceRoute('coruscant', 'tatooine')
    expect(route.distanceParsecs).toBeGreaterThan(0)
    expect(route.class1TravelHours).toBeGreaterThan(0)
    expect(route.hyperlane).toBeDefined()
  })
})

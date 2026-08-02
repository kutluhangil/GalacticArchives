import { describe, expect, it } from 'vitest'
import { loadStarships } from '../../src/lib/lore'

describe('starships dataset integrity', () => {
  it('loads all starships with valid fields', async () => {
    const starships = await loadStarships()
    expect(starships.length).toBeGreaterThanOrEqual(10)

    const ids = new Set<string>()
    for (const ship of starships) {
      expect(ship.id).toBeTruthy()
      expect(ids.has(ship.id)).toBe(false)
      ids.add(ship.id)

      expect(ship.names.en).toBeTruthy()
      expect(ship.names.tr).toBeTruthy()
      expect(ship.model).toBeTruthy()
      expect(ship.manufacturer.en).toBeTruthy()
      expect(ship.starshipClass.en).toBeTruthy()
      expect(ship.desc.en).toBeTruthy()
      expect(ship.appearances.length).toBeGreaterThan(0)
    }
  })
})

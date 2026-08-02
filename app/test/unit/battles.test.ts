import { describe, expect, it } from 'vitest'
import { loadAllPlanets, loadBattles, stations } from '../../src/lib/lore'

describe('battles dataset integrity', () => {
  it('loads all battles and verifies planet location references', async () => {
    const battles = await loadBattles()
    const planets = await loadAllPlanets()
    const moons = planets.flatMap((p) => p.moonsDetail ?? [])
    const allBodies = [...planets, ...moons, ...stations]
    const bodyIds = new Set(allBodies.map((b) => b.id))

    expect(battles.length).toBeGreaterThanOrEqual(8)

    const ids = new Set<string>()
    for (const battle of battles) {
      expect(battle.id).toBeTruthy()
      expect(ids.has(battle.id)).toBe(false)
      ids.add(battle.id)

      expect(battle.names.en).toBeTruthy()
      expect(battle.names.tr).toBeTruthy()
      expect(battle.yearLabel).toBeTruthy()
      expect(battle.era).toBeTruthy()
      expect(battle.desc.en).toBeTruthy()
      expect(battle.desc.tr).toBeTruthy()
      expect(battle.locationName.en).toBeTruthy()

      // Ensure every battle's locationPlanetId maps to an existing world or moon in the archive
      expect(bodyIds.has(battle.locationPlanetId)).toBe(true)
    }
  })
})


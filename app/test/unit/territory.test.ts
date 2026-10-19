import { describe, expect, it } from 'vitest'
import territoriesJson from '../../src/data/territories.json'
import factionsJson from '../../src/data/meta/factions.json'
import type { EraId } from '../../src/types/lore'

describe('Territory and Faction Heatmap data', () => {
  const eras: EraId[] = ['old-republic', 'clone-wars', 'empire', 'new-republic']
  const validFactionIds = (factionsJson as { id: string }[]).map((f) => f.id)

  it('covers all 4 galactic eras with valid territories', () => {
    for (const era of eras) {
      const eraTerritories = territoriesJson.filter((t) => t.era === era)
      expect(eraTerritories.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('maintains balanced territorial control percentages near 100% per era', () => {
    for (const era of eras) {
      const eraTerritories = territoriesJson.filter((t) => t.era === era)
      const totalPercent = eraTerritories.reduce((acc, t) => acc + t.controlPercent, 0)
      expect(totalPercent).toBeGreaterThanOrEqual(95)
      expect(totalPercent).toBeLessThanOrEqual(105)
    }
  })

  it('contains valid faction references, geometry, and bilingual fields', () => {
    for (const t of territoriesJson) {
      expect(validFactionIds).toContain(t.factionId)
      expect(t.name.en).toBeTruthy()
      expect(t.name.tr).toBeTruthy()
      expect(t.leader.en).toBeTruthy()
      expect(t.leader.tr).toBeTruthy()
      expect(t.doctrine.en).toBeTruthy()
      expect(t.doctrine.tr).toBeTruthy()
      expect(t.capital.en).toBeTruthy()
      expect(t.capital.tr).toBeTruthy()
      expect(t.keySystems.en.length).toBeGreaterThan(0)
      expect(t.keySystems.tr.length).toBeGreaterThan(0)
      expect(t.geometry.cx).toBeGreaterThanOrEqual(0)
      expect(t.geometry.cx).toBeLessThanOrEqual(100)
      expect(t.geometry.cy).toBeGreaterThanOrEqual(0)
      expect(t.geometry.cy).toBeLessThanOrEqual(100)
      expect(t.geometry.rx).toBeGreaterThan(0)
      expect(t.geometry.ry).toBeGreaterThan(0)
    }
  })
})

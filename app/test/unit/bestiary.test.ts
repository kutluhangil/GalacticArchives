import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import bestiaryJson from '../../src/data/bestiary.json'
import type { BestiaryCreature, DangerLevel } from '../../src/types/lore'

describe('Bestiary & Wildlife Codex data', () => {
  const creatures = bestiaryJson as BestiaryCreature[]
  const validDangerLevels: DangerLevel[] = ['low', 'moderate', 'high', 'extreme', 'lethal']
  const bestiaryDir = path.resolve(__dirname, '../../public/bestiary')

  it('contains at least 12 canonical Star Wars bestiary creatures', () => {
    expect(creatures.length).toBeGreaterThanOrEqual(12)
    const expected = ['rancor', 'krayt-dragon', 'purrgil', 'sarlacc', 'loth-wolf', 'exogorth', 'acklay', 'reek', 'nexu', 'varactyl', 'bantha', 'tauntaun']
    for (const exp of expected) {
      expect(creatures.some((c) => c.id === exp)).toBe(true)
    }
  })

  it('has comprehensive bilingual lore, traits, and valid threat ratings', () => {
    for (const c of creatures) {
      expect(c.id).toBeTruthy()
      expect(c.names.en).toBeTruthy()
      expect(c.names.tr).toBeTruthy()
      expect(c.classification.en).toBeTruthy()
      expect(c.classification.tr).toBeTruthy()
      expect(c.homeworld.en).toBeTruthy()
      expect(c.homeworld.tr).toBeTruthy()
      expect(c.diet.en).toBeTruthy()
      expect(c.diet.tr).toBeTruthy()
      expect(c.averageSize).toBeTruthy()
      expect(validDangerLevels).toContain(c.dangerLevel)
      expect(c.traits.en.length).toBeGreaterThan(0)
      expect(c.traits.tr.length).toBeGreaterThan(0)
      expect(c.temperament.en).toBeTruthy()
      expect(c.temperament.tr).toBeTruthy()
      expect(c.notableEncounters.en).toBeTruthy()
      expect(c.notableEncounters.tr).toBeTruthy()
      expect(c.desc.en).toBeTruthy()
      expect(c.desc.tr).toBeTruthy()
      expect(c.source.startsWith('wookieepedia:')).toBe(true)
    }
  })

  it('has corresponding optimized WebP images for all bestiary records', () => {
    for (const c of creatures) {
      const assetPath = path.join(bestiaryDir, `${c.id}.webp`)
      expect(fs.existsSync(assetPath)).toBe(true)
      const stats = fs.statSync(assetPath)
      expect(stats.size).toBeGreaterThan(1000)
    }
  })
})

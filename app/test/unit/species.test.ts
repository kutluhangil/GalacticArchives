import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadSpecies } from '../../src/lib/lore'
import speciesData from '../../src/data/species.json'

describe('Sentient Species Codex', () => {
  it('loads all 12 canonical species', async () => {
    const list = await loadSpecies()
    expect(list.length).toBe(12)
  })

  it('verifies data structure and bilingual attributes for every species', () => {
    for (const s of speciesData) {
      expect(s.id).toBeTruthy()
      expect(s.names.en).toBeTruthy()
      expect(s.names.tr).toBeTruthy()
      expect(s.classification.en).toBeTruthy()
      expect(s.classification.tr).toBeTruthy()
      expect(s.homeworldName.en).toBeTruthy()
      expect(s.language.en).toBeTruthy()
      expect(s.distinctions.en).toBeTruthy()
      expect(s.distinctions.tr).toBeTruthy()
      expect(s.desc.en).toBeTruthy()
      expect(s.desc.tr).toBeTruthy()
      expect(s.source).toMatch(/^wookieepedia:/)
    }
  })

  it('verifies that each species has a corresponding WebP portrait in public/species', () => {
    const publicDir = join(__dirname, '../../public/species')
    for (const s of speciesData) {
      const portraitPath = join(publicDir, `${s.id}.webp`)
      expect(existsSync(portraitPath)).toBe(true)
    }
  })
})

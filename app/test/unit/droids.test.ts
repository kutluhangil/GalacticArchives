import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadDroids } from '../../src/lib/lore'
import droidsData from '../../src/data/droids.json'
import { playDroidVocabulator } from '../../src/lib/droid-audio'

describe('Droid Directory & Vocabulator', () => {
  it('loads all 12 canonical droids', async () => {
    const list = await loadDroids()
    expect(list.length).toBe(12)
  })

  it('verifies data structure and bilingual attributes for every droid', () => {
    const validClasses = ['class-1', 'class-2', 'class-3', 'class-4', 'class-5']
    for (const d of droidsData) {
      expect(d.id).toBeTruthy()
      expect(d.names.en).toBeTruthy()
      expect(d.names.tr).toBeTruthy()
      expect(d.model).toBeTruthy()
      expect(validClasses).toContain(d.droidClass)
      expect(d.droidClassName.en).toBeTruthy()
      expect(d.manufacturer.en).toBeTruthy()
      expect(d.primaryFunction.en).toBeTruthy()
      expect(d.primaryFunction.tr).toBeTruthy()
      expect(d.desc.en).toBeTruthy()
      expect(d.desc.tr).toBeTruthy()
      expect(d.soundType).toBeTruthy()
      expect(d.source).toMatch(/^wookieepedia:/)
    }
  })

  it('verifies that each droid has a corresponding WebP portrait in public/droids', () => {
    const publicDir = join(__dirname, '../../public/droids')
    for (const d of droidsData) {
      const portraitPath = join(publicDir, `${d.id}.webp`)
      expect(existsSync(portraitPath)).toBe(true)
    }
  })

  it('verifies that playDroidVocabulator runs safely for all sound types', () => {
    const soundTypes = ['astromech', 'gonk', 'battledroid', 'protocol', 'mouse', 'assassin', 'medical']
    for (const st of soundTypes) {
      expect(() => playDroidVocabulator(st)).not.toThrow()
    }
  })
})

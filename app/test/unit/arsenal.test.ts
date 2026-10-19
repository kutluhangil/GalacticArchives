import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadArsenal } from '../../src/lib/lore'
import arsenalData from '../../src/data/arsenal.json'

describe('Galactic Arsenal & Superweapons', () => {
  it('loads all 12 weapons, materials, and superweapons', async () => {
    const list = await loadArsenal()
    expect(list.length).toBe(12)
  })

  it('verifies data structure and bilingual attributes for every arsenal entry', () => {
    const validCategories = ['blaster', 'heavy-weapon', 'melee-exotic', 'material-armor', 'superweapon']
    for (const item of arsenalData) {
      expect(item.id).toBeTruthy()
      expect(item.names.en).toBeTruthy()
      expect(item.names.tr).toBeTruthy()
      expect(validCategories).toContain(item.category)
      expect(item.categoryName.en).toBeTruthy()
      expect(item.categoryName.tr).toBeTruthy()
      expect(item.manufacturerOrOrigin.en).toBeTruthy()
      expect(item.rangeYield.en).toBeTruthy()
      expect(item.primaryUsers.en).toBeTruthy()
      expect(item.technicalSpecs.en).toBeTruthy()
      expect(item.desc.en).toBeTruthy()
      expect(item.desc.tr).toBeTruthy()
      expect(item.source).toMatch(/^wookieepedia:/)
    }
  })

  it('verifies that each arsenal item has a corresponding WebP asset in public/arsenal', () => {
    const publicDir = join(__dirname, '../../public/arsenal')
    for (const item of arsenalData) {
      const assetPath = join(publicDir, `${item.id}.webp`)
      expect(existsSync(assetPath)).toBe(true)
    }
  })
})

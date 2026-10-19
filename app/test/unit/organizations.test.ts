import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import organizationsJson from '../../src/data/organizations.json'
import type { Organization, OrganizationType } from '../../src/types/lore'

describe('Organizations, Clans & Syndicates data', () => {
  const orgs = organizationsJson as Organization[]
  const validTypes: OrganizationType[] = ['force-tradition', 'military-clan', 'crime-syndicate', 'guild']
  const orgDir = path.resolve(__dirname, '../../public/organizations')

  it('contains at least 10 canonical Star Wars organizations and syndicates', () => {
    expect(orgs.length).toBeGreaterThanOrEqual(10)
    const expected = [
      'jedi-order',
      'sith-order',
      'mandalorian-clans',
      'bounty-hunters-guild',
      'pyke-syndicate',
      'crimson-dawn',
      'black-sun',
      'inquisitorius',
      'hutt-cartels',
      'knights-of-ren',
    ]
    for (const exp of expected) {
      expect(orgs.some((o) => o.id === exp)).toBe(true)
    }
  })

  it('has comprehensive bilingual lore, creeds, philosophy, and valid categories', () => {
    for (const o of orgs) {
      expect(o.id).toBeTruthy()
      expect(o.names.en).toBeTruthy()
      expect(o.names.tr).toBeTruthy()
      expect(validTypes).toContain(o.type)
      expect(o.typeName.en).toBeTruthy()
      expect(o.typeName.tr).toBeTruthy()
      expect(o.leader.en).toBeTruthy()
      expect(o.leader.tr).toBeTruthy()
      expect(o.headquarters.en).toBeTruthy()
      expect(o.headquarters.tr).toBeTruthy()
      expect(o.activeEras.en).toBeTruthy()
      expect(o.activeEras.tr).toBeTruthy()
      expect(o.creedOrMotto.en).toBeTruthy()
      expect(o.creedOrMotto.tr).toBeTruthy()
      expect(o.philosophyOrPurpose.en).toBeTruthy()
      expect(o.philosophyOrPurpose.tr).toBeTruthy()
      expect(o.notableMembers.en.length).toBeGreaterThan(0)
      expect(o.notableMembers.tr.length).toBeGreaterThan(0)
      expect(o.desc.en).toBeTruthy()
      expect(o.desc.tr).toBeTruthy()
      expect(o.source.startsWith('wookieepedia:')).toBe(true)
    }
  })

  it('has corresponding optimized WebP insignia images for all organization records', () => {
    for (const o of orgs) {
      const assetPath = path.join(orgDir, `${o.id}.webp`)
      expect(fs.existsSync(assetPath)).toBe(true)
      const stats = fs.statSync(assetPath)
      expect(stats.size).toBeGreaterThan(1000)
    }
  })
})

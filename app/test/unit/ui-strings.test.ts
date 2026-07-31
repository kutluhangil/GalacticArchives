// Chrome strings are bilingual by construction; this guards the runtime half
// of that promise (no blank or placeholder copy shipping in either language).

import { describe, expect, it } from 'vitest'
import { ERA_SHORT, t, tf, type UiKey } from '../../src/lib/ui-strings'
import { ERA_ORDER, eras } from '../../src/lib/lore'

// t() is a typed lookup, so the key list has to come from a value the module
// exports; ERA_SHORT plus a representative sample keeps this honest without
// re-declaring every key here.
const SAMPLE_KEYS: UiKey[] = ['brand', 'region', 'compare', 'settings', 'legends', 'kesselRun']

describe('t', () => {
  it('returns non-empty copy in both languages', () => {
    for (const key of SAMPLE_KEYS) {
      expect(t(key, 'en').trim(), `${key} en`).not.toBe('')
      expect(t(key, 'tr').trim(), `${key} tr`).not.toBe('')
    }
  })

  it('actually differs between languages where it should', () => {
    expect(t('region', 'en')).toBe('Region')
    expect(t('region', 'tr')).toBe('Bölge')
  })
})

describe('tf', () => {
  it('fills every placeholder in both languages', () => {
    // lane names carry no article of their own, so the template supplies it
    expect(tf('laneStopOf', 'en', { n: 3, total: 11, lane: 'Perlemian Trade Route' })).toBe(
      'Stop 3 of 11 on the Perlemian Trade Route',
    )
    expect(tf('laneStopOf', 'tr', { n: 3, total: 11, lane: 'Perlemian Ticaret Yolu' })).toBe(
      'Perlemian Ticaret Yolu üzerinde 11 durağın 3.',
    )
  })

  it('throws when a placeholder has no value, rather than rendering a hole', () => {
    expect(() => tf('laneStopOf', 'en', { n: 3 })).toThrow(/laneStopOf.*total/)
  })
})

describe('ERA_SHORT', () => {
  it('covers every era in ERA_ORDER, in both languages', () => {
    expect(Object.keys(ERA_SHORT).sort()).toEqual([...ERA_ORDER].sort())
    for (const era of ERA_ORDER) {
      expect(ERA_SHORT[era].en.trim(), `${era} en`).not.toBe('')
      expect(ERA_SHORT[era].tr.trim(), `${era} tr`).not.toBe('')
    }
  })
})

describe('era data', () => {
  it('carries a range and a bilingual blurb for every era', () => {
    for (const era of eras) {
      expect(era.range, `${era.id} range`).toMatch(/BBY|ABY/)
      expect(era.blurb.en.trim(), `${era.id} blurb en`).not.toBe('')
      expect(era.blurb.tr.trim(), `${era.id} blurb tr`).not.toBe('')
    }
  })
})

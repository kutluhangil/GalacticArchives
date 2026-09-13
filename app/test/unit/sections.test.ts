// The section table is read by two consumers that must agree: the running app
// (menu labels, tab titles) and the static-meta build. What is guarded here is
// that every section carries both languages, that a title is resolved for every
// route the router actually serves, and that a record route resolves to no
// title at all — its page supplies the record's own name.

import { describe, expect, it } from 'vitest'
import sectionMeta from '../../src/data/sections.json'
import { SITE_NAME, recordTitle, sectionName, titleForPath } from '../../src/lib/sections'

describe('section table', () => {
  it('names every section in both languages', () => {
    for (const section of sectionMeta.sections) {
      expect(section.name.tr.trim(), section.path).not.toBe('')
      expect(section.name.en.trim(), section.path).not.toBe('')
      expect(section.description.trim(), section.path).not.toBe('')
    }
    expect(sectionMeta.home.title.tr).not.toBe(sectionMeta.home.title.en)
  })

  it('resolves a section name by path', () => {
    expect(sectionName('/hangar', 'tr')).toBe('Hangar')
    expect(sectionName('/force', 'en')).toBe('Force Vault')
    expect(() => sectionName('/nowhere', 'tr')).toThrow(/no section is registered/)
  })
})

describe('titleForPath', () => {
  it('titles the front door in the language being read', () => {
    expect(titleForPath('/', 'tr')).toBe(sectionMeta.home.title.tr)
    expect(titleForPath('/', 'en')).toBe(sectionMeta.home.title.en)
  })

  it('titles every section, and follows the language', () => {
    for (const section of sectionMeta.sections) {
      expect(titleForPath(section.path, 'tr')).toBe(`${section.name.tr} — ${SITE_NAME}`)
      expect(titleForPath(section.path, 'en')).toBe(`${section.name.en} — ${SITE_NAME}`)
    }
  })

  it('leaves record routes to the page that loads the record', () => {
    expect(titleForPath('/planet/hoth', 'tr')).toBeNull()
    expect(titleForPath('/system/tatoo', 'tr')).toBeNull()
    expect(titleForPath('/holocron/planet/hoth', 'en')).toBeNull()
    expect(titleForPath('/holocron/character/leia-organa', 'en')).toBeNull()
  })

  it('titles an address the archive does not have', () => {
    expect(titleForPath('/nowhere', 'tr')).toBe(
      `${sectionMeta.notFound.title.tr} — ${SITE_NAME}`,
    )
    expect(titleForPath('/nowhere', 'en')).toBe(
      `${sectionMeta.notFound.title.en} — ${SITE_NAME}`,
    )
  })

  it('reads a trailing slash as the same route', () => {
    expect(titleForPath('/hangar/', 'tr')).toBe(titleForPath('/hangar', 'tr'))
  })

  it('builds a record title the way the static pages do', () => {
    expect(recordTitle('Hoth')).toBe(`Hoth — ${SITE_NAME}`)
  })
})

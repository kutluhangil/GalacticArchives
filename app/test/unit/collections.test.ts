// localStorage-backed favorites and recents.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  favorites,
  isFavorite,
  pushRecent,
  recents,
  savedTours,
  subscribeCollections,
  toggleFavorite,
  toggleSavedTour,
} from '../../src/lib/collections'

beforeEach(() => localStorage.clear())

describe('favorites', () => {
  it('starts empty', () => {
    expect(favorites()).toEqual([])
    expect(isFavorite('hoth')).toBe(false)
  })

  it('toggles on and off, reporting the new state', () => {
    expect(toggleFavorite('hoth')).toBe(true)
    expect(favorites()).toEqual(['hoth'])
    expect(isFavorite('hoth')).toBe(true)
    expect(toggleFavorite('hoth')).toBe(false)
    expect(favorites()).toEqual([])
  })

  it('keeps the newest star first', () => {
    toggleFavorite('hoth')
    toggleFavorite('endor')
    expect(favorites()).toEqual(['endor', 'hoth'])
  })
})

describe('recents', () => {
  it('is most-recent-first and free of duplicates', () => {
    pushRecent('hoth')
    pushRecent('endor')
    pushRecent('hoth')
    expect(recents()).toEqual(['hoth', 'endor'])
  })

  it('caps the list at 8 entries', () => {
    for (let i = 0; i < 12; i++) pushRecent(`world-${i}`)
    const list = recents()
    expect(list).toHaveLength(8)
    expect(list[0]).toBe('world-11')
    expect(list).not.toContain('world-3')
  })
})

describe('saved tours', () => {
  it('keeps a local, removable collection of guided routes', () => {
    expect(toggleSavedTour('skywalker')).toBe(true)
    expect(savedTours()).toEqual(['skywalker'])
    expect(toggleSavedTour('skywalker')).toBe(false)
    expect(savedTours()).toEqual([])
  })
})

describe('corrupt storage', () => {
  it('drops an unparseable entry instead of taking the app down', () => {
    localStorage.setItem('ga-favorites', '{not json')
    expect(favorites()).toEqual([])
    expect(localStorage.getItem('ga-favorites')).toBeNull()
  })

  it('ignores non-string members of a valid array', () => {
    localStorage.setItem('ga-favorites', JSON.stringify(['hoth', 42, null]))
    expect(favorites()).toEqual(['hoth'])
  })

  it('ignores a stored value that is not an array', () => {
    localStorage.setItem('ga-recents', JSON.stringify({ hoth: true }))
    expect(recents()).toEqual([])
  })
})

describe('subscribeCollections', () => {
  it('notifies on write and stops after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCollections(listener)
    toggleFavorite('hoth')
    pushRecent('hoth')
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    toggleFavorite('endor')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('does not fire for reads', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeCollections(listener)
    favorites()
    isFavorite('hoth')
    recents()
    expect(listener).not.toHaveBeenCalled()
    unsubscribe()
  })
})

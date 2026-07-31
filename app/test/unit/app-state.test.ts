// Global app store: persistence and the Legends/era coupling. The store reads
// localStorage at import time, so boot cases re-import the module.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function bootStore(stored: Record<string, string> = {}) {
  localStorage.clear()
  for (const [key, value] of Object.entries(stored)) localStorage.setItem(key, value)
  vi.resetModules()
  const { useApp } = await import('../../src/state/app')
  return useApp
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.resetModules())

describe('boot state', () => {
  it('defaults to Turkish, the Empire era, auto quality and no Legends', async () => {
    const useApp = await bootStore()
    const state = useApp.getState()
    expect(state.lang).toBe('tr')
    expect(state.era).toBe('empire')
    expect(state.quality).toBe('auto')
    expect(state.legends).toBe(false)
  })

  it('restores what the last session stored', async () => {
    const useApp = await bootStore({
      'ga-lang': 'en',
      'ga-era': 'clone-wars',
      'ga-quality': 'high',
      'ga-legends': '1',
    })
    const state = useApp.getState()
    expect(state.lang).toBe('en')
    expect(state.era).toBe('clone-wars')
    expect(state.quality).toBe('high')
    expect(state.legends).toBe(true)
  })

  it('never boots into the Legends-only era with the layer off', async () => {
    const useApp = await bootStore({ 'ga-era': 'old-republic', 'ga-legends': '0' })
    expect(useApp.getState().era).toBe('empire')
  })

  it('does boot into the Legends-only era with the layer on', async () => {
    const useApp = await bootStore({ 'ga-era': 'old-republic', 'ga-legends': '1' })
    expect(useApp.getState().era).toBe('old-republic')
  })
})

describe('setters persist', () => {
  it('writes language, era and quality through to localStorage', async () => {
    const useApp = await bootStore()
    useApp.getState().setLang('en')
    useApp.getState().setEra('new-republic')
    useApp.getState().setQuality('low')
    expect(localStorage.getItem('ga-lang')).toBe('en')
    expect(localStorage.getItem('ga-era')).toBe('new-republic')
    expect(localStorage.getItem('ga-quality')).toBe('low')
  })
})

describe('Legends layer', () => {
  it('strands nothing: switching the layer off leaves the Old Republic era', async () => {
    const useApp = await bootStore({ 'ga-era': 'old-republic', 'ga-legends': '1' })
    expect(useApp.getState().era).toBe('old-republic')

    useApp.getState().setLegends(false)
    expect(useApp.getState().legends).toBe(false)
    expect(useApp.getState().era).toBe('empire')
    expect(localStorage.getItem('ga-era')).toBe('empire')
    expect(localStorage.getItem('ga-legends')).toBe('0')
  })

  it('leaves a canon era alone when the layer goes off', async () => {
    const useApp = await bootStore({ 'ga-era': 'clone-wars', 'ga-legends': '1' })
    useApp.getState().setLegends(false)
    expect(useApp.getState().era).toBe('clone-wars')
  })

  it('turning the layer on changes no era', async () => {
    const useApp = await bootStore()
    useApp.getState().setLegends(true)
    expect(useApp.getState().era).toBe('empire')
    expect(localStorage.getItem('ga-legends')).toBe('1')
  })
})

describe('tour state', () => {
  it('walks start -> step -> pause -> end', async () => {
    const useApp = await bootStore()
    useApp.getState().startTour('skywalker')
    expect(useApp.getState().tour).toEqual({ id: 'skywalker', step: 0, playing: true })

    useApp.getState().setTourStep(3)
    expect(useApp.getState().tour?.step).toBe(3)

    useApp.getState().toggleTourPlaying()
    expect(useApp.getState().tour?.playing).toBe(false)

    useApp.getState().endTour()
    expect(useApp.getState().tour).toBeNull()
  })

  it('ignores step and play changes with no tour running', async () => {
    const useApp = await bootStore()
    useApp.getState().setTourStep(2)
    useApp.getState().toggleTourPlaying()
    expect(useApp.getState().tour).toBeNull()
  })
})

describe('clock mirrors', () => {
  it('setting a speed also marks the clock playing', async () => {
    const useApp = await bootStore()
    useApp.getState().toggleClockPlaying()
    expect(useApp.getState().clockPlaying).toBe(false)

    useApp.getState().setClockSpeed(60)
    expect(useApp.getState().clockSpeed).toBe(60)
    expect(useApp.getState().clockPlaying).toBe(true)
  })

  it('keeps the store and the module clock in step', async () => {
    const useApp = await bootStore()
    const { simClock } = await import('../../src/lib/sim-clock')
    useApp.getState().setClockSpeed(600)
    expect(simClock.getSpeed()).toBe(600)

    useApp.getState().toggleClockPlaying()
    expect(simClock.isPlaying()).toBe(false)

    useApp.getState().toggleClockPlaying()
    expect(simClock.isPlaying()).toBe(true)
  })
})

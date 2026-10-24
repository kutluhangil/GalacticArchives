// Every archetype a world can carry needs a soundscape, and each recipe has to
// be something Web Audio will accept: audible filter bands, swells slow enough
// to read as gusts and waves rather than tremolo, and gains that stay quiet.

import { describe, expect, it } from 'vitest'
import { AMBIENCE } from '../../src/lib/ambience'
import { ARCHETYPE_IDS } from '../../src/lib/engine/planet-shaders'

describe('ambience recipes', () => {
  it('cover every archetype the renderer knows', () => {
    expect(Object.keys(AMBIENCE).sort()).toEqual(Object.keys(ARCHETYPE_IDS).sort())
  })

  it.each(Object.entries(AMBIENCE))('%s stays in audible, gentle ranges', (_id, recipe) => {
    expect(recipe.noise.freq).toBeGreaterThan(20)
    expect(recipe.noise.freq).toBeLessThan(20000)
    expect(recipe.noise.gain).toBeLessThanOrEqual(1)
    expect(recipe.swell.rate).toBeGreaterThan(0)
    expect(recipe.swell.rate).toBeLessThan(0.5)
    expect(recipe.swell.depth).toBeGreaterThanOrEqual(0)
    expect(recipe.swell.depth).toBeLessThanOrEqual(1)
    if (recipe.drone) {
      expect(recipe.drone.gain).toBeLessThan(0.1)
      for (const f of recipe.drone.freqs) expect(f).toBeGreaterThan(20)
    }
  })
})

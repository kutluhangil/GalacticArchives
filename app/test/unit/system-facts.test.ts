// A system is not a record of its own — canon gives 81 worlds 81 distinct
// system names — so `systemFacts` reads the system off the primary body. What
// is guarded here is that it reports only what the record states: the suns it
// lists, the moon figure it carries (and nothing when it carries none), each
// named moon once, and the stations that exist in the era being asked about.

import { describe, expect, it } from 'vitest'
import { loadBody, systemFacts } from '../../src/lib/lore'

describe('systemFacts', () => {
  it('reads the suns the primary lists', async () => {
    const tatooine = await loadBody('tatooine')
    const facts = systemFacts(tatooine, 'empire', 'en')

    expect(facts.name).toBe('Tatoo system')
    expect(facts.suns.map((s) => s.name)).toEqual(['Tatoo I', 'Tatoo II'])
  })

  it('names a moon once, even when it is both renderable and listed', async () => {
    // Concordia has its own recipe and also appears in Mandalore's minor list
    const mandalore = await loadBody('mandalore')
    const facts = systemFacts(mandalore, 'empire', 'en')

    expect(facts.namedMoons.filter((m) => m === 'Concordia')).toHaveLength(1)
    expect(facts.namedMoons).toContain('Mesumika')
  })

  it('localizes the moons it can name', async () => {
    const yavin = await loadBody('yavin')

    expect(systemFacts(yavin, 'empire', 'en').namedMoons).toEqual(['Yavin 4'])
    expect(systemFacts(yavin, 'empire', 'tr').namedMoons).toHaveLength(1)
  })

  it('reports the canon moon figure apart from the names, and omits it when unstated', async () => {
    const yavin = await loadBody('yavin')
    // twenty-six moons, one of which the archive holds a record for
    expect(systemFacts(yavin, 'empire', 'en').moonCount).toBe(26)

    const nalHutta = await loadBody('nal-hutta')
    expect(systemFacts(nalHutta, 'empire', 'en').moonCount).toBeUndefined()
    expect(systemFacts(nalHutta, 'empire', 'en').namedMoons).toEqual(['Nar Shaddaa'])
  })

  it('stands the stations up only in the eras they exist in', async () => {
    const yavin = await loadBody('yavin')

    expect(systemFacts(yavin, 'empire', 'en').stations.map((s) => s.id)).toEqual(['death-star'])
    expect(systemFacts(yavin, 'clone-wars', 'en').stations).toEqual([])
    expect(systemFacts(yavin, 'new-republic', 'en').stations).toEqual([])
  })

  it('leaves a sunless record sunless rather than inventing a star', async () => {
    const coruscant = await loadBody('coruscant')
    const facts = systemFacts(coruscant, 'empire', 'en')

    expect(facts.suns.length).toBe(coruscant.suns?.length ?? 0)
    expect(facts.namedMoons).toEqual(coruscant.moons ?? [])
  })
})

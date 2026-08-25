import { describe, expect, it } from 'vitest'
import { ArchiveGraphValidationError, buildArchiveGraph } from '../../src/lib/archive-graph'
import { loadArchiveGraph } from '../../src/lib/archive-graph-loader'
import { relationshipItemsFor } from '../../src/lib/archive-relationships'
import { loadAllPlanets, loadCharacters, loadTimelineEvents, stations } from '../../src/lib/lore'

describe('ArchiveGraph', () => {
  it('derives deterministic, source-backed relationships from shipped records', async () => {
    const bodies = [...(await loadAllPlanets()), ...(await loadAllPlanets()).flatMap((body) => body.moonsDetail ?? []), ...stations]
    const graph = buildArchiveGraph({
      bodies: [...bodies].reverse(),
      characters: [...(await loadCharacters())].reverse(),
      events: [...(await loadTimelineEvents())].reverse(),
    })

    expect(graph.nodes).toEqual([...graph.nodes].sort((a, b) => a.id.localeCompare(b.id)))
    expect(graph.edges.some((edge) => edge.type === 'homeworld' && edge.from === 'character:luke-skywalker' && edge.to === 'body:tatooine')).toBe(true)
    expect(graph.edges.some((edge) => edge.type === 'participates-in' && edge.from === 'character:luke-skywalker' && edge.to === 'event:battle-of-yavin')).toBe(true)
    expect(graph.edges.every((edge) => edge.evidence.length > 0)).toBe(true)
  })

  it('rejects a record that points to an unknown relationship target', () => {
    expect(() =>
      buildArchiveGraph({
        bodies: [],
        characters: [
          {
            id: 'orphan',
            names: { en: 'Orphan', tr: 'Yetim' },
            species: { en: 'Human', tr: 'İnsan' },
            bio: { en: 'Missing homeworld', tr: 'Eksik anavatan' },
            appearances: [],
            homeworldId: 'missing-world',
          },
        ],
        events: [],
      }),
    ).toThrow(ArchiveGraphValidationError)
  })

  it('loads the complete shipped graph through the lore adapter', async () => {
    const graph = await loadArchiveGraph()

    expect(graph.nodes.some((node) => node.id === 'body:tatooine')).toBe(true)
    expect(graph.nodes.some((node) => node.id === 'body:yavin-4')).toBe(true)
    expect(graph.nodes.some((node) => node.id === 'body:death-star')).toBe(true)
  })

  it('adapts graph edges into routeable relationship records', () => {
    const graph = buildArchiveGraph({
      bodies: [
        {
          id: 'tatooine', kind: 'planet', names: { en: 'Tatooine', tr: 'Tatooine' }, desc: { en: '', tr: '' },
          region: 'outer-rim', system: 'Tatoo', appearances: [], renderRecipe: { archetype: 'desert', palette: { primary: '#000' } },
        },
      ],
      characters: [
        {
          id: 'luke', names: { en: 'Luke', tr: 'Luke' }, species: { en: 'Human', tr: 'İnsan' },
          bio: { en: '', tr: '' }, appearances: [], homeworldId: 'tatooine',
        },
      ],
      events: [],
    })

    expect(relationshipItemsFor(graph, 'character:luke', new Map([['body:tatooine', 'Tatooine']]))).toEqual([
      expect.objectContaining({ label: 'Tatooine', relation: 'homeworld', to: '/holocron/planet/tatooine' }),
    ])
  })

  it('keeps a homeworld ahead of less direct world appearances', () => {
    const graph = buildArchiveGraph({
      bodies: [
        { id: 'home', kind: 'planet', names: { en: 'Home', tr: 'Ev' }, desc: { en: '', tr: '' }, region: 'outer-rim', system: 'Home', appearances: [], renderRecipe: { archetype: 'desert', palette: { primary: '#000' } } },
        { id: 'visit', kind: 'planet', names: { en: 'Visit', tr: 'Ziyaret' }, desc: { en: '', tr: '' }, region: 'outer-rim', system: 'Visit', appearances: [], characters: ['luke'], renderRecipe: { archetype: 'desert', palette: { primary: '#000' } } },
      ],
      characters: [{ id: 'luke', names: { en: 'Luke', tr: 'Luke' }, species: { en: 'Human', tr: 'İnsan' }, bio: { en: '', tr: '' }, appearances: [], homeworldId: 'home' }],
      events: [],
    })

    expect(relationshipItemsFor(graph, 'character:luke', new Map([
      ['body:home', 'Home'], ['body:visit', 'Visit'],
    ]))[0]).toMatchObject({ label: 'Home', relation: 'homeworld' })
  })
})

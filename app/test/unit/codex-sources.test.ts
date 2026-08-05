// The codex records (starships, battles, Force powers, timeline events,
// watch-guide entries, transmissions) carry the same provenance rule the bodies
// and characters do: each one cites the Wookieepedia article it was written
// from, and that article is in the committed snapshot. validate-lore enforces
// this in CI; these tests keep the rule from being dropped from the app's own
// data path, where the citation is what the UI links to.

import { describe, expect, it } from 'vitest'
import battles from '../../src/data/battles.json'
import forcePowers from '../../src/data/force-powers.json'
import starships from '../../src/data/starships.json'
import timeline from '../../src/data/timeline.json'
import transmissions from '../../src/data/transmissions.json'
import watchGuide from '../../src/data/watch-guide.json'
import digest from '../fixtures/codex-digest.json'
import { articleUrl } from '../../src/lib/sources'

const articles = digest.articles as Record<string, { missing?: boolean; continuity?: string }>

const datasets: [string, { id: string; source?: string }[]][] = [
  ['starships', starships],
  ['battles', battles],
  ['force-powers', forcePowers],
  ['timeline', timeline],
  ['watch-guide', watchGuide],
  ['transmissions', transmissions],
]

describe('codex provenance', () => {
  it.each(datasets)('every %s record cites an article in the snapshot', (_name, records) => {
    expect(records.length).toBeGreaterThan(0)
    for (const record of records) {
      expect(record.source, `${record.id} has no source`).toMatch(/^wookieepedia:.+/)
      const article = record.source!.slice('wookieepedia:'.length)
      expect(articles[article], `${record.id} cites unsnapshotted "${article}"`).toBeTruthy()
      expect(articles[article].missing, `${record.id} cites a missing article`).toBeUndefined()
    }
  })

  it('in-universe records never cite a real-world article', () => {
    for (const [, records] of datasets.filter(([name]) => name !== 'watch-guide')) {
      for (const record of records) {
        const article = record.source!.slice('wookieepedia:'.length)
        expect(articles[article].continuity, `${record.id}`).not.toBe('unstated')
      }
    }
  })

  it('a Legends-only power is marked as such rather than presented as canon', () => {
    const powers = forcePowers as { id: string; source: string; continuity?: string }[]
    for (const power of powers) {
      const article = power.source.slice('wookieepedia:'.length)
      expect(power.continuity ?? 'canon', power.id).toBe(articles[article].continuity)
    }
  })

  it('a transcript states whether it is quoted or reconstructed', () => {
    for (const transmission of transmissions as { id: string; verbatim?: boolean }[]) {
      expect(typeof transmission.verbatim, transmission.id).toBe('boolean')
    }
  })

  it('a citation turns into the article url the UI links to', () => {
    expect(articleUrl('wookieepedia:Battle of Yavin')).toBe(
      'https://starwars.fandom.com/wiki/Battle_of_Yavin',
    )
  })
})

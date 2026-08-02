import { describe, expect, it } from 'vitest'
import timelineJson from '../../src/data/timeline.json'

describe('Timeline Events dataset', () => {
  it('contains events spanning BBY and ABY eras', () => {
    expect(timelineJson.length).toBeGreaterThanOrEqual(8)
    const bbyEvents = timelineJson.filter((e) => e.yearBBYABY <= 0)
    const abyEvents = timelineJson.filter((e) => e.yearBBYABY > 0)
    expect(bbyEvents.length).toBeGreaterThan(0)
    expect(abyEvents.length).toBeGreaterThan(0)
  })

  it('has bilingual titles and descriptions for every event', () => {
    for (const event of timelineJson) {
      expect(event.titles.en).toBeTruthy()
      expect(event.titles.tr).toBeTruthy()
      expect(event.desc.en).toBeTruthy()
      expect(event.desc.tr).toBeTruthy()
    }
  })
})

import { describe, expect, it } from 'vitest'
import { toursForBody } from '../../src/lib/tour-index'

describe('toursForBody', () => {
  it('returns only shipped guided routes that explicitly stop at the record', () => {
    expect(toursForBody('scarif').map((tour) => tour.id)).toEqual(['rogue-one'])
    expect(toursForBody('not-a-world')).toEqual([])
  })
})

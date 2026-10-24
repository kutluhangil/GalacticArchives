// Corellian Spike rules the sabacc table relies on: the deck, the ranking
// chain, the dealer droid's choices and the shift that redeals both hands.

import { describe, expect, it } from 'vitest'
import {
  applyMove,
  compareHands,
  deal,
  droidMove,
  handLabel,
  makeDeck,
  MAX_HAND,
  rollSpike,
  sabaccShift,
  seededRng,
  total,
  type Card,
} from '../../src/lib/sabacc'

const c = (value: number, suit: Card['suit'] = 'circle'): Card => ({ id: `${suit}${value}`, suit, value })
const sylop = (id: string): Card => ({ id, suit: 'sylop', value: 0 })

describe('deck', () => {
  it('has 62 unique cards summing to zero, two of them sylops', () => {
    const deck = makeDeck()
    expect(deck).toHaveLength(62)
    expect(new Set(deck.map((d) => d.id)).size).toBe(62)
    expect(total(deck)).toBe(0)
    expect(deck.filter((d) => d.suit === 'sylop')).toHaveLength(2)
  })

  it('deals two cards each and conserves every card', () => {
    const t = deal(seededRng(7))
    expect(t.player).toHaveLength(2)
    expect(t.droid).toHaveLength(2)
    expect(t.deck.length + t.discard.length + 4).toBe(62)
  })
})

describe('ranking', () => {
  it('puts pure sabacc above an ordinary zero', () => {
    expect(compareHands([sylop('a'), sylop('b')], [c(3), c(-3)])).toBeGreaterThan(0)
  })

  it('prefers the total nearest zero', () => {
    expect(compareHands([c(1)], [c(-4), c(2)])).toBeGreaterThan(0)
  })

  it('breaks an equal distance toward the positive total', () => {
    expect(compareHands([c(5), c(-4)], [c(-5), c(4)])).toBeGreaterThan(0)
  })

  it('breaks equal totals on hand size', () => {
    expect(compareHands([c(2), c(3), c(-5)], [c(6), c(-6)])).toBeGreaterThan(0)
  })

  it('reports an exact tie as zero', () => {
    expect(compareHands([c(4), c(-4, 'square')], [c(4, 'triangle'), c(-4)])).toBe(0)
  })

  it('labels the hand', () => {
    expect(handLabel([sylop('a'), sylop('b')], 'en')).toBe('Pure Sabacc!')
    expect(handLabel([c(4), c(-4)], 'tr')).toBe('Sabacc!')
    expect(handLabel([c(4), c(-1)], 'en')).toBe('+3')
  })
})

describe('moves', () => {
  it('gain adds a card but never past the hand limit', () => {
    const rng = seededRng(3)
    let t = deal(rng)
    for (let i = 0; i < 6; i++) t = applyMove(t, 'player', { kind: 'gain' }, rng)
    expect(t.player).toHaveLength(MAX_HAND)
  })

  it('swap replaces the chosen card and discards it', () => {
    const rng = seededRng(11)
    const t = deal(rng)
    const swapped = t.player[0]
    const next = applyMove(t, 'player', { kind: 'swap', index: 0 }, rng)
    expect(next.player).toHaveLength(2)
    expect(next.player[0].id).not.toBe(swapped.id)
    expect(next.discard.at(-1)).toEqual(swapped)
  })

  it('the droid stands near zero and swaps out the worst card otherwise', () => {
    expect(droidMove([c(1), c(1)])).toEqual({ kind: 'stand' })
    expect(droidMove([c(9), c(-1)])).toEqual({ kind: 'gain' })
    expect(droidMove([c(9), c(2), c(-1)])).toEqual({ kind: 'swap', index: 0 })
  })

  it('a shift redeals both hands at the same size', () => {
    const rng = seededRng(5)
    let t = deal(rng)
    t = applyMove(t, 'player', { kind: 'gain' }, rng)
    const shifted = sabaccShift(t, rng)
    expect(shifted.player).toHaveLength(3)
    expect(shifted.droid).toHaveLength(2)
    const all = [...shifted.deck, ...shifted.discard, ...shifted.player, ...shifted.droid]
    expect(new Set(all.map((d) => d.id)).size).toBe(62)
  })

  it('spike dice shift only on doubles', () => {
    for (let seed = 0; seed < 50; seed++) {
      const roll = rollSpike(seededRng(seed))
      expect(roll.shift).toBe(roll.dice[0] === roll.dice[1])
    }
  })
})

// Corellian Spike sabacc, the variant Han and Lando play in Solo (2018).
// 62 cards: three suits of +1..+10 and -1..-10, plus two zero-value sylops.
// The hand closest to zero wins; after every round a pair of spike dice is
// rolled and doubles force a "sabacc shift": every hand is discarded and
// redealt at the same size.
//
// shortcut: the named special hands (Fleet, Yee-Haa, Rhylet...) are folded into
// the plain tiebreak chain below; add them if the table ever grows betting.

export type Suit = 'circle' | 'triangle' | 'square' | 'sylop'

export interface Card {
  id: string
  suit: Suit
  value: number
}

export type Rng = () => number

export const MAX_HAND = 5
export const ROUNDS = 3

export function makeDeck(): Card[] {
  const deck: Card[] = [
    { id: 'sylop-a', suit: 'sylop', value: 0 },
    { id: 'sylop-b', suit: 'sylop', value: 0 },
  ]
  for (const suit of ['circle', 'triangle', 'square'] as const) {
    for (let v = 1; v <= 10; v++) {
      deck.push({ id: `${suit}+${v}`, suit, value: v })
      deck.push({ id: `${suit}-${v}`, suit, value: -v })
    }
  }
  return deck
}

/** Fisher–Yates on a copy */
export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export const total = (hand: Card[]) => hand.reduce((sum, c) => sum + c.value, 0)

const isPureSabacc = (hand: Card[]) => hand.length === 2 && hand.every((c) => c.suit === 'sylop')

/**
 * Comparable strength, highest wins. Order of the Corellian Spike tiebreaks:
 * pure sabacc, then nearest to zero, a positive total over a negative one,
 * more cards, the larger positive sum, the single highest positive card.
 */
export function handRank(hand: Card[]): number[] {
  const t = total(hand)
  const positives = hand.filter((c) => c.value > 0).map((c) => c.value)
  return [
    isPureSabacc(hand) ? 1 : 0,
    -Math.abs(t),
    t >= 0 ? 1 : 0,
    hand.length,
    positives.reduce((a, b) => a + b, 0),
    positives.length ? Math.max(...positives) : 0,
  ]
}

/** >0 when `a` beats `b`, <0 when it loses, 0 on a true tie */
export function compareHands(a: Card[], b: Card[]): number {
  const ra = handRank(a)
  const rb = handRank(b)
  for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]
  return 0
}

export function handLabel(hand: Card[], lang: 'en' | 'tr'): string {
  if (isPureSabacc(hand)) return lang === 'tr' ? 'Saf Sabacc!' : 'Pure Sabacc!'
  if (total(hand) === 0) return 'Sabacc!'
  return `${total(hand) > 0 ? '+' : ''}${total(hand)}`
}

export interface Table {
  deck: Card[]
  discard: Card[]
  player: Card[]
  droid: Card[]
  round: number
}

export function deal(rng: Rng): Table {
  const deck = shuffle(makeDeck(), rng)
  const player = deck.splice(0, 2)
  const droid = deck.splice(0, 2)
  const discard = deck.splice(0, 1)
  return { deck, discard, player, droid, round: 1 }
}

/** draw from the deck, reshuffling the discard pile under it when it runs dry */
function draw(t: Table, rng: Rng): Card {
  if (t.deck.length === 0) {
    const top = t.discard.pop()
    t.deck = shuffle(t.discard, rng)
    t.discard = top ? [top] : []
  }
  return t.deck.shift()!
}

export type Move = { kind: 'stand' } | { kind: 'gain' } | { kind: 'swap'; index: number }

export function applyMove(table: Table, who: 'player' | 'droid', move: Move, rng: Rng): Table {
  const t: Table = { ...table, deck: table.deck.slice(), discard: table.discard.slice() }
  const hand = table[who].slice()
  if (move.kind === 'gain' && hand.length < MAX_HAND) hand.push(draw(t, rng))
  if (move.kind === 'swap' && hand[move.index]) {
    t.discard.push(hand[move.index])
    hand[move.index] = draw(t, rng)
  }
  t[who] = hand
  return t
}

/** The dealer droid plays a plain greedy game: stand near zero, otherwise
 *  trade away the card that is pulling the total furthest from it. */
export function droidMove(hand: Card[]): Move {
  const t = total(hand)
  if (Math.abs(t) <= 2 || (Math.abs(t) <= 4 && hand.length >= 4)) return { kind: 'stand' }
  if (hand.length < 3) return { kind: 'gain' }
  let worst = 0
  hand.forEach((c, i) => {
    if (Math.abs(t - c.value) < Math.abs(t - hand[worst].value)) worst = i
  })
  return { kind: 'swap', index: worst }
}

export interface SpikeRoll {
  dice: [number, number]
  shift: boolean
}

export function rollSpike(rng: Rng): SpikeRoll {
  const dice: [number, number] = [1 + Math.floor(rng() * 6), 1 + Math.floor(rng() * 6)]
  return { dice, shift: dice[0] === dice[1] }
}

/** sabacc shift: both hands go to the discard pile and are redealt at size */
export function sabaccShift(table: Table, rng: Rng): Table {
  const t: Table = { ...table, deck: table.deck.slice(), discard: [...table.discard, ...table.player, ...table.droid] }
  t.player = table.player.map(() => draw(t, rng))
  t.droid = table.droid.map(() => draw(t, rng))
  return t
}

/** small deterministic generator so a dealt table can be replayed in tests */
export function seededRng(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let x = Math.imul(s ^ (s >>> 15), 1 | s)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

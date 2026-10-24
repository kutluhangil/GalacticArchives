// Corellian Spike sabacc against the dealer droid. Rules live in lib/sabacc;
// this is only the table: three rounds, a spike roll after each, showdown.

import { useState } from 'react'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'
import {
  applyMove,
  compareHands,
  deal,
  droidMove,
  handLabel,
  MAX_HAND,
  rollSpike,
  ROUNDS,
  sabaccShift,
  type Card,
  type Move,
  type SpikeRoll,
  type Table,
} from '../lib/sabacc'
import ModalShell from './ModalShell'

const GLYPH: Record<Card['suit'], string> = { circle: '●', triangle: '▲', square: '■', sylop: '◎' }
const SUIT_NAME: Record<Card['suit'], { en: string; tr: string }> = {
  circle: { en: 'circle', tr: 'daire' },
  triangle: { en: 'triangle', tr: 'üçgen' },
  square: { en: 'square', tr: 'kare' },
  sylop: { en: 'sylop', tr: 'sylop' },
}

const signed = (v: number) => (v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0')

function CardFace({ card, hidden, onPick, label }: { card: Card; hidden?: boolean; onPick?: () => void; label?: string }) {
  const tone = card.value > 0 ? 'text-emerald-300' : card.value < 0 ? 'text-red-300' : 'text-star-gold'
  const body = hidden ? (
    <span className="font-display text-lg text-holo-cyan/50">✦</span>
  ) : (
    <>
      <span className={`text-sm ${tone}`}>{GLYPH[card.suit]}</span>
      <span className={`font-display text-xl ${tone}`}>{signed(card.value)}</span>
    </>
  )
  const cls =
    'flex h-20 w-14 flex-col items-center justify-center gap-1 rounded-md border bg-black/50 transition-all'
  if (onPick)
    return (
      <button
        onClick={onPick}
        aria-label={label}
        className={`${cls} border-holo-cyan/60 hover:-translate-y-1 hover:shadow-[0_0_12px_rgba(102,217,255,0.4)]`}
      >
        {body}
      </button>
    )
  return <div className={`${cls} ${hidden ? 'border-white/10' : 'border-white/20'}`}>{body}</div>
}

export default function SabaccTable({ onClose }: { onClose: () => void }) {
  const lang = useApp((s) => s.lang)
  const tr = lang === 'tr'
  const [table, setTable] = useState<Table>(() => deal(Math.random))
  const [swapping, setSwapping] = useState(false)
  const [roll, setRoll] = useState<SpikeRoll | null>(null)
  const [log, setLog] = useState<string>(tr ? 'Krupiye droid kartları dağıttı.' : 'The dealer droid deals the cards.')
  const [outcome, setOutcome] = useState<number | null>(null)
  const [record, setRecord] = useState({ win: 0, loss: 0, tie: 0 })

  const play = (move: Move) => {
    sfx.playSelect()
    setSwapping(false)
    let t = applyMove(table, 'player', move, Math.random)
    const droid = droidMove(t.droid)
    t = applyMove(t, 'droid', droid, Math.random)
    const spike = rollSpike(Math.random)
    if (spike.shift) t = sabaccShift(t, Math.random)
    setRoll(spike)

    const droidSays =
      droid.kind === 'stand'
        ? tr ? 'Droid bekledi' : 'The droid stands'
        : droid.kind === 'gain'
          ? tr ? 'Droid kart çekti' : 'The droid gains a card'
          : tr ? 'Droid bir kart değiştirdi' : 'The droid swaps a card'
    const shiftSays = spike.shift
      ? tr ? ' — ÇİFT ZAR: Sabacc kayması! Eller yeniden dağıtıldı.' : ' — DOUBLES: sabacc shift! Hands redealt.'
      : ''

    if (t.round >= ROUNDS) {
      const result = compareHands(t.player, t.droid)
      setOutcome(result)
      setRecord((r) =>
        result > 0 ? { ...r, win: r.win + 1 } : result < 0 ? { ...r, loss: r.loss + 1 } : { ...r, tie: r.tie + 1 },
      )
      if (result > 0) sfx.playHyperspace()
      setLog(`${droidSays}${shiftSays}`)
      setTable(t)
      return
    }
    setLog(`${droidSays}${shiftSays}`)
    setTable({ ...t, round: t.round + 1 })
  }

  const newHand = () => {
    sfx.playSelect()
    setTable(deal(Math.random))
    setRoll(null)
    setOutcome(null)
    setSwapping(false)
    setLog(tr ? 'Yeni el dağıtıldı.' : 'A new hand is dealt.')
  }

  const done = outcome !== null
  const cardLabel = (card: Card) =>
    `${tr ? 'Değiştir' : 'Swap'}: ${SUIT_NAME[card.suit][lang]} ${signed(card.value)}`

  return (
    <ModalShell title={`🎴 ${tr ? 'SABACC — CORELLIAN SPIKE' : 'SABACC — CORELLIAN SPIKE'}`} onClose={onClose} panelClassName="max-w-2xl">
      <div className="mt-3 space-y-4 font-hud text-[12px] text-slate-300">
        <p className="text-[11px] leading-relaxed text-slate-400">
          {tr
            ? 'Amaç: el toplamını sıfıra en yakın tutmak. Üç tur oynanır; her turdan sonra spike zarları atılır, çift gelirse tüm eller yeniden dağıtılır. İki sylop (0) Saf Sabacc’tır.'
            : 'Goal: keep your hand total closest to zero. Three rounds; after each the spike dice roll, and doubles redeal every hand. Two sylops (0) make Pure Sabacc.'}
        </p>

        <div className="flex items-center justify-between text-[11px] tracking-widest text-slate-400">
          <span>
            {tr ? 'TUR' : 'ROUND'} {Math.min(table.round, ROUNDS)} / {ROUNDS}
          </span>
          <span>
            {roll ? `🎲 ${roll.dice[0]} · ${roll.dice[1]}` : '🎲 — · —'}
          </span>
          <span className="text-holo-cyan">
            {tr ? 'G/M/B' : 'W/L/T'}: {record.win}/{record.loss}/{record.tie}
          </span>
        </div>

        <section aria-label={tr ? 'Droid eli' : 'Droid hand'}>
          <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
            <span>🤖 {tr ? 'Krupiye droid' : 'Dealer droid'}</span>
            {done && <span className="text-slate-300">{handLabel(table.droid, lang)}</span>}
          </div>
          <div className="flex gap-2">
            {table.droid.map((card) => (
              <CardFace key={card.id} card={card} hidden={!done} />
            ))}
          </div>
        </section>

        <section aria-label={tr ? 'Senin elin' : 'Your hand'}>
          <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-widest text-slate-500">
            <span>🧑‍🚀 {tr ? 'Senin elin' : 'Your hand'}</span>
            <span className="text-slate-200">{handLabel(table.player, lang)}</span>
          </div>
          <div className="flex gap-2">
            {table.player.map((card, i) => (
              <CardFace
                key={card.id}
                card={card}
                label={cardLabel(card)}
                onPick={swapping ? () => play({ kind: 'swap', index: i }) : undefined}
              />
            ))}
          </div>
        </section>

        <p aria-live="polite" className="min-h-[2.5em] rounded border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-slate-300">
          {log}
          {done && (
            <strong className={`ml-1 ${outcome! > 0 ? 'text-emerald-300' : outcome! < 0 ? 'text-red-300' : 'text-star-gold'}`}>
              {outcome! > 0
                ? tr ? '— Kazandın!' : '— You win!'
                : outcome! < 0
                  ? tr ? '— Droid kazandı.' : '— The droid wins.'
                  : tr ? '— Berabere.' : '— A tie.'}
            </strong>
          )}
        </p>

        <div className="flex flex-wrap gap-2">
          {done ? (
            <button onClick={newHand} className="rounded border border-star-gold/60 bg-star-gold/15 px-4 py-1.5 tracking-wider text-star-gold hover:bg-star-gold/25">
              {tr ? 'Yeni el' : 'New hand'}
            </button>
          ) : swapping ? (
            <>
              <span className="self-center text-[11px] text-holo-cyan">{tr ? 'Değiştirilecek kartı seç' : 'Pick a card to swap'}</span>
              <button onClick={() => setSwapping(false)} className="rounded border border-white/15 px-3 py-1.5 text-slate-300 hover:border-white/40">
                {tr ? 'Vazgeç' : 'Cancel'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => play({ kind: 'gain' })}
                disabled={table.player.length >= MAX_HAND}
                className="rounded border border-holo-cyan/50 bg-holo-cyan/15 px-4 py-1.5 tracking-wider text-holo-cyan hover:bg-holo-cyan/25 disabled:opacity-40"
              >
                {tr ? 'Kart çek' : 'Gain'}
              </button>
              <button onClick={() => setSwapping(true)} className="rounded border border-holo-cyan/50 px-4 py-1.5 tracking-wider text-holo-cyan hover:bg-holo-cyan/15">
                {tr ? 'Değiştir' : 'Swap'}
              </button>
              <button onClick={() => play({ kind: 'stand' })} className="rounded border border-white/20 px-4 py-1.5 tracking-wider text-slate-200 hover:border-white/40">
                {tr ? 'Bekle' : 'Stand'}
              </button>
            </>
          )}
        </div>
      </div>
    </ModalShell>
  )
}

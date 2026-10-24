// The Guild board: canon contracts pinned to the worlds where they turned.
// Postings for the selected era come first; each links to its world page.

import { useEffect, useState } from 'react'
import { useApp } from '../state/app'
import { L, loadBounties, mediaById } from '../lib/lore'
import type { Bounty } from '../types/lore'
import { sfx } from '../lib/audio'
import ModalShell from './ModalShell'
import SourceLink from './SourceLink'

const STATUS: Record<Bounty['status'], { en: string; tr: string; cls: string }> = {
  delivered: { en: 'DELIVERED', tr: 'TESLİM EDİLDİ', cls: 'border-emerald-500/50 text-emerald-300' },
  failed: { en: 'FAILED', tr: 'BAŞARISIZ', cls: 'border-red-500/50 text-red-300' },
  abandoned: { en: 'CONTRACT BROKEN', tr: 'SÖZLEŞME BOZULDU', cls: 'border-star-gold/50 text-star-gold' },
}

/** `onGo` belongs to the caller: closing this board unmounts it, which would
 *  cancel a flight scheduled from inside */
export default function BountyBoard({ onClose, onGo }: { onClose: () => void; onGo: (planetId: string) => void }) {
  const { lang, era } = useApp()
  const tr = lang === 'tr'
  const [bounties, setBounties] = useState<Bounty[]>([])

  useEffect(() => {
    void loadBounties().then(setBounties)
  }, [])

  // the current era's postings lead; the rest keep their chronological order
  const ordered = [...bounties.filter((b) => b.era === era), ...bounties.filter((b) => b.era !== era)]

  return (
    <ModalShell title={`🎯 ${tr ? 'LONCA ÖDÜL PANOSU' : 'GUILD BOUNTY BOARD'}`} onClose={onClose} panelClassName="max-w-3xl" accent="star-gold">
      <ul className="mt-4 grid max-h-[65vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {ordered.map((b) => {
          const status = STATUS[b.status]
          return (
            <li
              key={b.id}
              className={`flex flex-col gap-2 rounded-lg border bg-black/40 p-3 font-hud ${
                b.era === era ? 'border-star-gold/40' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] tracking-[0.3em] text-slate-500">{tr ? 'HEDEF' : 'TARGET'}</p>
                  <h3 className="font-display text-[15px] tracking-wide text-slate-100">{L(b.target, lang)}</h3>
                </div>
                <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] tracking-widest ${status.cls}`}>
                  {status[lang]}
                </span>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                <dt className="text-slate-500">{tr ? 'Müşteri' : 'Client'}</dt>
                <dd className="text-slate-300">{L(b.client, lang)}</dd>
                <dt className="text-slate-500">{tr ? 'Avcılar' : 'Hunters'}</dt>
                <dd className="text-slate-300">{L(b.hunters, lang)}</dd>
                <dt className="text-slate-500">{tr ? 'Yıl' : 'Year'}</dt>
                <dd className="text-slate-300">{b.yearLabel}</dd>
                {b.reward && (
                  <>
                    <dt className="text-slate-500">{tr ? 'Ödül' : 'Reward'}</dt>
                    <dd className="text-star-gold">{L(b.reward, lang)}</dd>
                  </>
                )}
              </dl>
              <p className="text-[11.5px] leading-relaxed text-slate-400">{L(b.desc, lang)}</p>
              <div className="mt-auto flex flex-wrap items-center gap-2 text-[10px]">
                <button
                  onClick={() => {
                    sfx.playSelect()
                    onClose()
                    onGo(b.planetId)
                  }}
                  className="rounded border border-holo-cyan/40 px-2 py-0.5 text-holo-cyan hover:bg-holo-cyan/15"
                >
                  ◉ {tr ? 'Dünyaya git' : 'Go to world'}
                </button>
                {b.appearances.map((id) => (
                  <span key={id} className="rounded border border-white/10 px-1.5 py-0.5 text-slate-500">
                    {mediaById(id) ? L(mediaById(id)!.title, lang) : id}
                  </span>
                ))}
                <SourceLink source={b.source} />
              </div>
            </li>
          )
        })}
      </ul>
    </ModalShell>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { L, loadTimelineEvents } from '../lib/lore'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import { sfx } from '../lib/audio'

export default function Timeline() {
  const lang = useApp((s) => s.lang)
  const [events, setEvents] = useState<any[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    loadTimelineEvents().then(setEvents)
  }, [])

  const filteredEvents = events.filter(
    (e) => filterCategory === 'all' || e.category === filterCategory
  )

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-space pb-20">
      <TopBar />

      <div className="mx-auto max-w-5xl px-4 pt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h1 className="font-display text-2xl tracking-[0.25em] text-slate-100">
              {lang === 'tr' ? 'GALAKTİK ZAMAN ÇİZELGESİ' : 'GALACTIC CHRONOLOGY'}
            </h1>
            <p className="mt-1 font-hud text-xs text-slate-400">
              {lang === 'tr'
                ? '25.000 BBY ile 35 ABY Arasındaki Tüm Tarihi Galaktik Dönüm Noktaları'
                : 'Galactic Milestones from 25,000 BBY to 35 ABY'}
            </p>
          </div>

          <div className="flex rounded border border-white/10 bg-black/40 p-0.5">
            {[
              { id: 'all', label: lang === 'tr' ? 'HEPSİ' : 'ALL' },
              { id: 'battle', label: lang === 'tr' ? 'SAVAŞLAR' : 'BATTLES' },
              { id: 'political', label: lang === 'tr' ? 'SİYASET' : 'POLITICAL' },
              { id: 'jedi-sith', label: 'JEDI & SITH' },
              { id: 'construction', label: lang === 'tr' ? 'İNŞALAR' : 'CONSTRUCTION' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  sfx.playHover()
                  setFilterCategory(cat.id)
                }}
                className={`rounded px-3 py-1 font-hud text-[11px] uppercase tracking-wider transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-star-gold/20 text-star-gold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-8 border-l border-holo-cyan/30 pl-6 space-y-8 ml-3 sm:ml-6">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline node marker */}
              <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-holo-cyan bg-space group-hover:bg-holo-cyan transition-colors" />

              <div className="rounded-lg border border-white/10 bg-panel/70 p-4 transition-all hover:border-holo-cyan/40 hover:bg-panel/90">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-hud text-xs font-bold tracking-widest text-star-gold">
                    {evt.yearLabel}
                  </span>
                  <span className="rounded bg-white/5 px-2 py-0.5 font-hud text-[9px] uppercase tracking-wider text-holo-cyan">
                    {evt.category}
                  </span>
                </div>

                <h3 className="mt-2 font-display text-lg tracking-wider text-slate-100">
                  {L(evt.titles, lang)}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {L(evt.desc, lang)}
                </p>

                {evt.planetId && (
                  <div className="mt-3 pt-2 border-t border-white/5 flex gap-3 text-[11px]">
                    <Link
                      to={`/planet/${evt.planetId}`}
                      className="text-holo-cyan hover:underline"
                    >
                      🌐 {lang === 'tr' ? 'Gezegen Sayfası' : 'Planet Page'}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

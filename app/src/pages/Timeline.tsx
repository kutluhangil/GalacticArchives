// Galactic chronology. The events were a flat list, which said nothing about
// the shape of the era they belong to: scrolling from the founding of the
// Republic to Exegol read the same as scrolling a table.
//
// The page is scroll-driven now. Events sit in era sections, a rail tracks
// which era the reader is inside, and the record level with the middle of the
// viewport marks itself. All of it is progressive: with no scrolling at all, or
// motion switched off, the list still reads top to bottom — the marking is a
// CSS transition the global reduced-motion rule flattens.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { EraId, TimelineEvent } from '../types/lore'
import { eras, L, loadTimelineEvents } from '../lib/lore'
import { ERA_SHORT } from '../lib/ui-strings'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import { sfx } from '../lib/audio'
import SourceLink from '../components/SourceLink'

const CATEGORY_LABEL: Record<string, { en: string; tr: string }> = {
  battle: { en: 'Battle', tr: 'Savaş' },
  political: { en: 'Political', tr: 'Siyaset' },
  'jedi-sith': { en: 'Jedi & Sith', tr: 'Jedi ve Sith' },
  construction: { en: 'Construction', tr: 'İnşa' },
}

export default function Timeline() {
  const lang = useApp((s) => s.lang)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')
  /** the event the reader is currently level with, from the observer below */
  const [activeId, setActiveId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTimelineEvents().then(setEvents)
  }, [])

  useEffect(() => {
    if (!events.length || !window.location.hash.startsWith('#event-')) return
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [events])

  const filteredEvents = useMemo(
    () => events.filter((e) => filterCategory === 'all' || e.category === filterCategory),
    [events, filterCategory],
  )

  /** events in era order, empty eras dropped so a filter cannot leave a gap */
  const sections = useMemo(() => {
    return eras
      .map((era) => ({
        era: era.id as EraId,
        range: era.range,
        events: filteredEvents.filter((e) => e.era === era.id),
      }))
      .filter((section) => section.events.length > 0)
  }, [filteredEvents])

  // The event level with the middle of the viewport is the active one, and it
  // drives both the rail and the record's own marking. Measured on scroll
  // rather than through an IntersectionObserver: there are eight events, the
  // measurement is trivial, and observers get throttled in a tab the browser
  // considers hidden — which is exactly when a reader would come back to find
  // the rail pointing at the wrong era.
  useEffect(() => {
    const scroller = scrollerRef.current
    const list = listRef.current
    if (!scroller || !list) return

    let frame = 0
    const measure = () => {
      frame = 0
      const middle = scroller.clientHeight / 2
      let closest: { id: string; distance: number } | null = null
      for (const node of list.querySelectorAll<HTMLElement>('[data-event-id]')) {
        const rect = node.getBoundingClientRect()
        const distance = Math.abs((rect.top + rect.bottom) / 2 - middle)
        const id = node.dataset.eventId
        if (id && (!closest || distance < closest.distance)) closest = { id, distance }
      }
      setActiveId(closest?.id ?? null)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sections])

  const activeEra = useMemo(
    () => filteredEvents.find((e) => e.id === activeId)?.era ?? sections[0]?.era,
    [activeId, filteredEvents, sections],
  )

  const jumpToEra = (era: EraId) => {
    sfx.playHover()
    document.getElementById(`era-${era}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  return (
    <div
      ref={scrollerRef}
      className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-space pb-20"
    >
      <TopBar />

      <main className="mx-auto max-w-5xl px-4 pt-24">
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

          <div
            role="group"
            aria-label={lang === 'tr' ? 'Türe göre süz' : 'Filter by category'}
            className="flex flex-wrap rounded border border-white/10 bg-black/40 p-0.5"
          >
            {[
              { id: 'all', label: lang === 'tr' ? 'HEPSİ' : 'ALL' },
              { id: 'battle', label: lang === 'tr' ? 'SAVAŞLAR' : 'BATTLES' },
              { id: 'political', label: lang === 'tr' ? 'SİYASET' : 'POLITICAL' },
              { id: 'jedi-sith', label: 'JEDI & SITH' },
              { id: 'construction', label: lang === 'tr' ? 'İNŞALAR' : 'CONSTRUCTION' },
            ].map((cat) => (
              <button
                key={cat.id}
                aria-pressed={filterCategory === cat.id}
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
          {/* Era rail: where the reader is in the chronology, and a way to move */}
          <nav
            aria-label={lang === 'tr' ? 'Dönemler' : 'Eras'}
            className="hidden lg:block"
          >
            <div className="sticky top-4 space-y-1">
              {sections.map((section) => {
                const current = section.era === activeEra
                return (
                  <button
                    key={section.era}
                    onClick={() => jumpToEra(section.era)}
                    aria-current={current ? 'true' : undefined}
                    className={`block w-full border-l-2 py-1.5 pl-3 text-left transition-colors ${
                      current
                        ? 'border-star-gold text-star-gold'
                        : 'border-white/10 text-slate-500 hover:border-white/30 hover:text-slate-300'
                    }`}
                  >
                    <span className="block font-hud text-[11px] uppercase tracking-wider">
                      {ERA_SHORT[section.era][lang]}
                    </span>
                    <span className="block text-[10px] text-slate-600">{section.range}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* the tail lets the last event reach the middle of the viewport, so the
              final era can actually become the active one */}
          <div ref={listRef} className="pb-[45vh]">
            {sections.map((section) => (
              <section key={section.era} id={`era-${section.era}`} className="mb-10 scroll-mt-4">
                <div className="sticky top-0 z-10 -mx-2 mb-4 bg-space/95 px-2 py-3 backdrop-blur-sm">
                  <h2 className="font-hud text-[10px] uppercase tracking-[0.35em] text-slate-500">
                    {ERA_SHORT[section.era][lang]}
                    <span className="ml-2 text-slate-600">{section.range}</span>
                  </h2>
                </div>

                <div className="relative ml-3 space-y-8 border-l border-holo-cyan/30 pl-6 sm:ml-6">
                  {section.events.map((evt) => {
                    const active = evt.id === activeId
                    return (
                      <div id={`event-${evt.id}`} key={evt.id} data-event-id={evt.id} className="group relative scroll-mt-8">
                        {/* Timeline node marker */}
                        <div
                          className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 transition-all ${
                            active
                              ? 'scale-125 border-star-gold bg-star-gold'
                              : 'border-holo-cyan bg-space group-hover:bg-holo-cyan'
                          }`}
                        />

                        <div
                          className={`rounded-lg border p-4 transition-all duration-500 ${
                            active
                              ? 'border-star-gold/40 bg-panel/95 opacity-100'
                              : 'border-white/10 bg-panel/70 opacity-80 hover:border-holo-cyan/40 hover:bg-panel/90 hover:opacity-100'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-hud text-xs font-bold tracking-widest text-star-gold">
                              {evt.yearLabel}
                            </span>
                            <span className="rounded bg-white/5 px-2 py-0.5 font-hud text-[9px] uppercase tracking-wider text-holo-cyan">
                              {CATEGORY_LABEL[evt.category]?.[lang] ?? evt.category}
                            </span>
                          </div>

                          <h3 className="mt-2 font-display text-lg tracking-wider text-slate-100">
                            {L(evt.titles, lang)}
                          </h3>

                          <p className="mt-2 text-xs leading-relaxed text-slate-300">
                            {L(evt.desc, lang)}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/5 pt-2 text-[11px]">
                            {evt.planetId && (
                              <Link
                                to={`/planet/${evt.planetId}`}
                                className="text-holo-cyan hover:underline"
                              >
                                🌐 {lang === 'tr' ? 'Gezegen Sayfası' : 'Planet Page'}
                              </Link>
                            )}
                            <SourceLink source={evt.source} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}

            {sections.length === 0 && (
              <p className="py-12 text-center font-hud text-[12px] text-slate-500">
                {lang === 'tr' ? 'Bu filtre için olay yok.' : 'No events match this filter.'}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

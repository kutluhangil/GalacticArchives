// Chronological Watch Guide — complete Star Wars canon viewing order
// with filters, deep-links to planets/characters, and bilingual content.

import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import TopBar from '../components/hud/TopBar'
import { useApp } from '../state/app'
import { sfx } from '../lib/audio'
import watchData from '../data/watch-guide.json'

type LangKey = 'en' | 'tr'
type MediaType = 'film' | 'live-action' | 'animation'
type SortMode = 'chronological' | 'release'

interface WatchEntry {
  id: string
  titles: { en: string; tr: string }
  type: MediaType
  releaseYear: number
  chronologicalYear: string
  chronologicalOrder: number
  releaseOrder: number
  synopsis: { en: string; tr: string }
  planets: string[]
  characters: string[]
  era: string
}

const entries = watchData as WatchEntry[]

const TYPE_BADGE: Record<MediaType, { en: string; tr: string; color: string; bg: string }> = {
  film: { en: 'Film', tr: 'Film', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'live-action': { en: 'Live-Action', tr: 'Canlı Aksiyon', color: '#66D9FF', bg: 'rgba(102,217,255,0.12)' },
  animation: { en: 'Animation', tr: 'Animasyon', color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
}

const ERA_LABEL: Record<string, { en: string; tr: string }> = {
  'clone-wars': { en: 'Clone Wars Era', tr: 'Klon Savaşları Dönemi' },
  empire: { en: 'Imperial Era', tr: 'İmparatorluk Dönemi' },
  'new-republic': { en: 'New Republic Era', tr: 'Yeni Cumhuriyet Dönemi' },
}

export default function WatchGuide() {
  const lang = useApp((s) => s.lang) as LangKey
  const [sortMode, setSortMode] = useState<SortMode>('chronological')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    let list = [...entries]
    if (typeFilter !== 'all') list = list.filter((e) => e.type === typeFilter)
    list.sort((a, b) =>
      sortMode === 'chronological'
        ? a.chronologicalOrder - b.chronologicalOrder
        : a.releaseOrder - b.releaseOrder
    )
    return list
  }, [sortMode, typeFilter])

  // Group by era when in chronological mode
  const grouped = useMemo(() => {
    if (sortMode !== 'chronological') return null
    const map = new Map<string, WatchEntry[]>()
    for (const e of sorted) {
      if (!map.has(e.era)) map.set(e.era, [])
      map.get(e.era)!.push(e)
    }
    return map
  }, [sorted, sortMode])

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-space pb-24">
      <TopBar />

      <div className="mx-auto max-w-4xl px-4 pt-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl tracking-[0.25em] text-slate-100">
            {lang === 'tr' ? '🎬 STAR WARS İZLEME REHBERİ' : '🎬 STAR WARS WATCH GUIDE'}
          </h1>
          <p className="mt-1 font-hud text-xs text-slate-400">
            {lang === 'tr'
              ? 'Tüm Kanon Filmler, Diziler ve Animasyonlar — Kronolojik veya Çıkış Sırasına Göre'
              : 'All Canon Films, Series & Animation — Chronological or Release Order'}
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Sort toggle */}
          <div className="flex rounded border border-white/10 bg-black/40 p-0.5">
            {([
              { id: 'chronological', label: lang === 'tr' ? '📅 Kronolojik' : '📅 Chronological' },
              { id: 'release', label: lang === 'tr' ? '🎞️ Çıkış Sırası' : '🎞️ Release Order' },
            ] as { id: SortMode; label: string }[]).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  sfx.playHover()
                  setSortMode(s.id)
                }}
                className={`rounded px-3 py-1.5 font-hud text-[10px] uppercase tracking-wider transition-all ${
                  sortMode === s.id
                    ? 'bg-star-gold/20 text-star-gold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex rounded border border-white/10 bg-black/40 p-0.5">
            {([
              { id: 'all', label: lang === 'tr' ? 'Hepsi' : 'All' },
              { id: 'film', label: lang === 'tr' ? 'Film' : 'Film' },
              { id: 'live-action', label: lang === 'tr' ? 'Canlı Aksiyon' : 'Live-Action' },
              { id: 'animation', label: lang === 'tr' ? 'Animasyon' : 'Animation' },
            ]).map((f) => {
              const badge = f.id !== 'all' ? TYPE_BADGE[f.id as MediaType] : null
              return (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`rounded px-2.5 py-1 font-hud text-[10px] uppercase tracking-wider transition-all ${
                    typeFilter === f.id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  style={
                    typeFilter === f.id && badge
                      ? { background: badge.bg, color: badge.color }
                      : typeFilter === f.id
                      ? { background: 'rgba(255,255,255,0.08)' }
                      : {}
                  }
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <span className="ml-auto font-hud text-[10px] text-slate-500">
            {sorted.length} {lang === 'tr' ? 'yapım' : 'entries'}
          </span>
        </div>

        {/* Chronological grouped view */}
        {grouped ? (
          Array.from(grouped.entries()).map(([era, items]) => (
            <div key={era} className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="font-hud text-[10px] uppercase tracking-[0.35em] text-slate-500">
                  {ERA_LABEL[era]?.[lang] ?? era}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-3">
                {items.map((entry, idx) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    idx={idx + 1}
                    lang={lang}
                    expanded={expandedId === entry.id}
                    onToggle={() => {
                      sfx.playSelect()
                      setExpandedId(expandedId === entry.id ? null : entry.id)
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Flat release order list
          <div className="space-y-3">
            {sorted.map((entry, idx) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                idx={idx + 1}
                lang={lang}
                expanded={expandedId === entry.id}
                onToggle={() => {
                  sfx.playSelect()
                  setExpandedId(expandedId === entry.id ? null : entry.id)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EntryCard({
  entry,
  idx,
  lang,
  expanded,
  onToggle,
}: {
  entry: WatchEntry
  idx: number
  lang: LangKey
  expanded: boolean
  onToggle: () => void
}) {
  const badge = TYPE_BADGE[entry.type]

  return (
    <div
      className={`rounded-lg border transition-all ${
        expanded
          ? 'border-white/20 bg-panel/80'
          : 'border-white/8 bg-panel/40 hover:border-white/15 hover:bg-panel/60'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        {/* Order number */}
        <span className="shrink-0 font-hud text-[11px] font-bold text-slate-600 w-5 text-right">
          {String(idx).padStart(2, '0')}
        </span>

        {/* Type badge */}
        <span
          className="shrink-0 rounded px-1.5 py-0.5 font-hud text-[9px] uppercase tracking-wider"
          style={{ color: badge.color, background: badge.bg }}
        >
          {badge[lang]}
        </span>

        {/* Title */}
        <span className="flex-1 font-display text-[14px] tracking-wide text-slate-100">
          {entry.titles[lang]}
        </span>

        {/* Year */}
        <span className="shrink-0 font-hud text-[10px] text-slate-500">
          {entry.releaseYear}
        </span>
        <span className="shrink-0 rounded border border-star-gold/20 bg-star-gold/5 px-1.5 py-0.5 font-hud text-[9px] text-star-gold">
          {entry.chronologicalYear}
        </span>

        <span className="shrink-0 text-slate-500 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="border-t border-white/8 px-4 py-4">
          <p className="text-[13px] leading-relaxed text-slate-300">{entry.synopsis[lang]}</p>

          {entry.planets.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 font-hud text-[9px] uppercase tracking-[0.3em] text-slate-500">
                {lang === 'tr' ? 'Öne Çıkan Gezegenler' : 'Featured Planets'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.planets.map((pid) => (
                  <Link
                    key={pid}
                    to={`/planet/${pid}`}
                    className="rounded border border-holo-cyan/25 bg-holo-cyan/5 px-2 py-0.5 font-hud text-[10px] text-holo-cyan hover:bg-holo-cyan/15 transition-colors"
                  >
                    🌐 {pid.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {entry.characters.length > 0 && (
            <div className="mt-3">
              <div className="mb-1.5 font-hud text-[9px] uppercase tracking-[0.3em] text-slate-500">
                {lang === 'tr' ? 'Öne Çıkan Karakterler' : 'Key Characters'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.characters.map((cid) => (
                  <Link
                    key={cid}
                    to={`/holocron/character/${cid}`}
                    className="rounded border border-star-gold/25 bg-star-gold/5 px-2 py-0.5 font-hud text-[10px] text-star-gold hover:bg-star-gold/15 transition-colors"
                  >
                    👤 {cid.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

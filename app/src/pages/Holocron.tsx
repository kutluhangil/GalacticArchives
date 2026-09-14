// Holocron index: every world and figure in the archive as one searchable
// grid. Search runs over both languages at once through Fuse, so a Turkish
// speaker can still find "Ölüm Yıldızı" by typing "death star".

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import Fuse from 'fuse.js'
import type { Battle, CelestialBody, Character, Starship } from '../types/lore'
import {
  L,
  loadAllPlanets,
  loadBattles,
  loadCharacters,
  loadStarships,
  media,
  regions,
  sectorShort,
  sectorsIn,
  stations,
} from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import HoloPortrait from '../components/HoloPortrait'
import HolocronChrome from '../components/HolocronChrome'
import HolocronQuiz from '../components/HolocronQuiz'
import { useRovingFocus } from '../hooks/useRovingFocus'
import { sfx } from '../lib/audio'


type Entry =
  | { kind: 'body'; id: string; body: CelestialBody }
  | { kind: 'character'; id: string; character: Character }
  | { kind: 'starship'; id: string; starship: Starship }
  | { kind: 'battle'; id: string; battle: Battle }

function bodyEntries(bodies: CelestialBody[]): Entry[] {
  return bodies.map((body) => ({ kind: 'body', id: body.id, body }))
}

/** the sector option for worlds canon places in no sector at all. A colon
 *  keeps it clear of every real sector name. */
const UNPLACED = 'unplaced:no-sector'

export default function Holocron() {
  const lang = useApp((s) => s.lang)
  const [bodies, setBodies] = useState<CelestialBody[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [starships, setStarships] = useState<Starship[]>([])
  const [battles, setBattles] = useState<Battle[]>([])
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [sector, setSector] = useState('')
  const [mediaId, setMediaId] = useState('')
  const [quizOpen, setQuizOpen] = useState(false)

  useEffect(() => {
    loadAllPlanets().then((planets) => {
      const moons = planets.flatMap((p) => p.moonsDetail ?? [])
      setBodies([...planets, ...moons, ...stations])
    })
    loadCharacters().then(setCharacters)
    loadStarships().then(setStarships)
    loadBattles().then(setBattles)
  }, [])

  const entries = useMemo<Entry[]>(
    () => [
      ...bodyEntries(bodies),
      ...characters.map((character) => ({ kind: 'character' as const, id: character.id, character })),
      ...starships.map((starship) => ({ kind: 'starship' as const, id: starship.id, starship })),
      ...battles.map((battle) => ({ kind: 'battle' as const, id: battle.id, battle })),
    ],
    [bodies, characters, starships, battles],
  )

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        threshold: 0.34,
        ignoreLocation: true,
        keys: [
          { name: 'body.names.en', weight: 3 },
          { name: 'body.names.tr', weight: 3 },
          { name: 'character.names.en', weight: 3 },
          { name: 'character.names.tr', weight: 3 },
          { name: 'starship.names.en', weight: 3 },
          { name: 'starship.names.tr', weight: 3 },
          { name: 'battle.names.en', weight: 3 },
          { name: 'battle.names.tr', weight: 3 },
        ],
      }),
    [entries],
  )

  // Canon states no sector borders, so the sector is an axis rather than a map
  // layer: the worlds the archive holds name 60 of them, listed with their
  // counts, plus the worlds canon leaves unplaced.
  const sectors = useMemo(() => sectorsIn(bodies), [bodies])
  const unplacedCount = useMemo(() => bodies.filter((b) => !b.sector).length, [bodies])

  const results = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : entries
    return base.filter((entry) => {
      if (region) {
        const entryRegion = entry.kind === 'body' ? entry.body.region : undefined
        if (entryRegion !== region) return false
      }
      if (sector) {
        if (entry.kind !== 'body') return false
        if (sector === UNPLACED) {
          if (entry.body.sector) return false
        } else if (entry.body.sector !== sector) return false
      }
      if (mediaId) {
        const appearances =
          entry.kind === 'body' ? entry.body.appearances : entry.kind === 'character' ? entry.character.appearances : entry.kind === 'starship' ? entry.starship.appearances : entry.battle.appearances
        if (!appearances.includes(mediaId)) return false
      }
      return true
    })
  }, [query, region, sector, mediaId, fuse, entries])

  // the two card grids are the only tabbable runs on the page, and unfiltered
  // they hold every world and every figure in the archive
  const { ref: worldGridRef, onKeyDown: onWorldGridKey } = useRovingFocus<HTMLDivElement>('grid')
  const { ref: figureGridRef, onKeyDown: onFigureGridKey } =
    useRovingFocus<HTMLDivElement>('grid')

  const worlds = results.filter((e): e is Extract<Entry, { kind: 'body' }> => e.kind === 'body')
  const figures = results.filter((e): e is Extract<Entry, { kind: 'character' }> => e.kind === 'character')
  const ships = results.filter((e): e is Extract<Entry, { kind: 'starship' }> => e.kind === 'starship')
  const conflictList = results.filter((e): e is Extract<Entry, { kind: 'battle' }> => e.kind === 'battle')

  return (
    <HolocronChrome>
      {quizOpen && <HolocronQuiz onClose={() => setQuizOpen(false)} />}
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[0.22em] text-star-gold">
            {t('holocron', lang).toUpperCase()}
          </h1>
          <p className="mt-2 font-hud text-[13px] tracking-wide text-slate-400">
            {t('holocronIntro', lang)}
          </p>
        </div>
        <button
          onClick={() => {
            sfx.playSelect()
            setQuizOpen(true)
          }}
          className="rounded border border-star-gold/40 bg-star-gold/10 px-4 py-2 font-hud text-[11px] tracking-widest text-star-gold transition-colors hover:bg-star-gold/25"
        >
          ◈ {lang === 'tr' ? 'ARŞİV TESTİ' : 'ARCHIVIST TRIAL'}
        </button>
      </header>


      <div className="mb-8 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder', lang)}
          aria-label={t('search', lang)}
          className="min-w-[240px] flex-1 rounded border border-white/10 bg-panel/80 px-3 py-2 text-[13px] text-slate-100 outline-hidden transition-colors placeholder:text-slate-400 focus:border-holo-cyan/60"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label={t('region', lang)}
          className="rounded border border-white/10 bg-panel/80 px-3 py-2 text-[13px] text-slate-200 outline-hidden focus:border-holo-cyan/60"
        >
          <option value="">{t('allRegions', lang)}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {L(r.names, lang)}
            </option>
          ))}
        </select>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          aria-label={t('sector', lang)}
          className="rounded border border-white/10 bg-panel/80 px-3 py-2 text-[13px] text-slate-200 outline-hidden focus:border-holo-cyan/60"
        >
          <option value="">{t('allSectors', lang)}</option>
          {sectors.map((s) => (
            <option key={s.name} value={s.name}>
              {sectorShort(s.name)} ({s.count})
            </option>
          ))}
          {unplacedCount > 0 && (
            <option value={UNPLACED}>
              {t('sectorUnstated', lang)} ({unplacedCount})
            </option>
          )}
        </select>
        <select
          value={mediaId}
          onChange={(e) => setMediaId(e.target.value)}
          aria-label={t('appearances', lang)}
          className="rounded border border-white/10 bg-panel/80 px-3 py-2 text-[13px] text-slate-200 outline-hidden focus:border-holo-cyan/60"
        >
          <option value="">{t('allMedia', lang)}</option>
          {media.map((m) => (
            <option key={m.id} value={m.id}>
              {L(m.title, lang)}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-4 font-hud text-[11px] uppercase tracking-[0.3em] text-slate-400">
        {results.length} {t('resultCount', lang)}
      </p>

      {results.length === 0 && (
        <p className="py-12 text-center text-[13px] text-slate-400">{t('noResults', lang)}</p>
      )}

      {worlds.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
            {t('worlds', lang)}
          </h2>
          <p id="worlds-grid-hint" className="sr-only">
            {t('arrowHint', lang)}
          </p>
          <div
            ref={worldGridRef}
            onKeyDown={onWorldGridKey}
            aria-describedby="worlds-grid-hint"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {worlds.map(({ body }) => (
              <Link
                key={body.id}
                data-roving-item
                to={`/holocron/planet/${body.id}`}
                onClick={() => sfx.playHover()}
                viewTransition
                className="group overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-holo-cyan/50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-cyan"
              >
                <img
                  src={`/cards/${body.id}.webp`}
                  alt=""
                  width={1200}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="aspect-2/1 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="bg-panel/90 px-2.5 py-2">
                  <div className="font-display text-[12px] tracking-[0.16em] text-slate-100">
                    {L(body.names, lang).toUpperCase()}
                  </div>
                  <div className="mt-0.5 font-hud text-[10px] tracking-[0.18em] text-slate-400">
                    {L(regions.find((r) => r.id === body.region)?.names, lang)}
                    {body.sector ? ` · ${sectorShort(body.sector)}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {ships.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
            🚀 {t('starships', lang)}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ships.map(({ starship }) => (
              <div
                key={starship.id}
                className="rounded-lg border border-white/10 bg-panel/90 p-4 transition-colors hover:border-holo-cyan/50"
              >
                <div className="font-display text-[14px] tracking-[0.14em] text-holo-cyan">
                  {L(starship.names, lang)}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  {starship.model} · {L(starship.starshipClass, lang)}
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  {L(starship.desc, lang)}
                </p>
                <div className="mt-3 flex justify-between border-t border-white/5 pt-2 text-[11px] text-slate-400">
                  <span>{L(starship.manufacturer, lang)}</span>
                  <span className="text-star-gold">{starship.hyperdriveRating}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {conflictList.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
            ⚔️ {t('battles', lang)}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conflictList.map(({ battle }) => (
              <div
                key={battle.id}
                className="rounded-lg border border-sith-red/30 bg-panel/90 p-4 transition-colors hover:border-sith-red/60"
              >
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-[14px] tracking-[0.14em] text-red-400">
                    {L(battle.names, lang)}
                  </div>
                  <span className="font-hud text-[10px] text-star-gold">{battle.yearLabel}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  📍 {L(battle.locationName, lang)}
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                  {L(battle.desc, lang)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {figures.length > 0 && (
        <section>
          <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
            {t('characters', lang)}
          </h2>
          <p id="figures-grid-hint" className="sr-only">
            {t('arrowHint', lang)}
          </p>
          <div
            ref={figureGridRef}
            onKeyDown={onFigureGridKey}
            aria-describedby="figures-grid-hint"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          >
            {figures.map(({ character }) => (
              <Link
                key={character.id}
                data-roving-item
                to={`/holocron/character/${character.id}`}
                onClick={() => sfx.playHover()}
                viewTransition
                className="group overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-holo-cyan/50 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-cyan"
              >
                <HoloPortrait
                  id={character.id}
                  name={L(character.names, lang)}
                  size="sm"
                  vtName={`holo-${character.id}`}
                />
                <div className="bg-panel/90 px-2.5 py-2">
                  <div className="font-display text-[12px] tracking-[0.14em] text-slate-100">
                    {L(character.names, lang)}
                  </div>
                  <div className="mt-0.5 font-hud text-[10px] tracking-[0.18em] text-slate-400">
                    {L(character.species, lang)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </HolocronChrome>
  )
}

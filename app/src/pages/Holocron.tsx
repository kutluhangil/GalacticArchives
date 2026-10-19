// Holocron index: every world and figure in the archive as one searchable
// grid. Search runs over both languages at once through Fuse, so a Turkish
// speaker can still find "Ölüm Yıldızı" by typing "death star".

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import Fuse from 'fuse.js'
import type { ArsenalItem, Battle, CelestialBody, Character, Droid, Species, Starship } from '../types/lore'
import {
  L,
  loadAllPlanets,
  loadArsenal,
  loadBattles,
  loadCharacters,
  loadDroids,
  loadSpecies,
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
import StarshipClassIcon from '../components/StarshipClassIcon'
import StarshipModal from '../components/StarshipModal'
import SpeciesModal from '../components/SpeciesModal'
import DroidModal from '../components/DroidModal'
import ArsenalModal from '../components/ArsenalModal'
import { useRovingFocus } from '../hooks/useRovingFocus'
import { sfx } from '../lib/audio'

type Entry =
  | { kind: 'body'; id: string; body: CelestialBody }
  | { kind: 'character'; id: string; character: Character }
  | { kind: 'starship'; id: string; starship: Starship }
  | { kind: 'battle'; id: string; battle: Battle }
  | { kind: 'species'; id: string; species: Species }
  | { kind: 'droid'; id: string; droid: Droid }
  | { kind: 'arsenal'; id: string; item: ArsenalItem }

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
  const [speciesList, setSpeciesList] = useState<Species[]>([])
  const [droids, setDroids] = useState<Droid[]>([])
  const [arsenalList, setArsenalList] = useState<ArsenalItem[]>([])
  const [selectedStarship, setSelectedStarship] = useState<Starship | null>(null)
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null)
  const [selectedDroid, setSelectedDroid] = useState<Droid | null>(null)
  const [selectedArsenalItem, setSelectedArsenalItem] = useState<ArsenalItem | null>(null)
  const [droidClassFilter, setDroidClassFilter] = useState<string>('')
  const [arsenalCategoryFilter, setArsenalCategoryFilter] = useState<string>('')
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
    loadSpecies().then(setSpeciesList)
    loadDroids().then(setDroids)
    loadArsenal().then(setArsenalList)
  }, [])

  const entries = useMemo<Entry[]>(
    () => [
      ...bodyEntries(bodies),
      ...characters.map((character) => ({ kind: 'character' as const, id: character.id, character })),
      ...starships.map((starship) => ({ kind: 'starship' as const, id: starship.id, starship })),
      ...battles.map((battle) => ({ kind: 'battle' as const, id: battle.id, battle })),
      ...speciesList.map((species) => ({ kind: 'species' as const, id: species.id, species })),
      ...droids.map((droid) => ({ kind: 'droid' as const, id: droid.id, droid })),
      ...arsenalList.map((item) => ({ kind: 'arsenal' as const, id: item.id, item })),
    ],
    [bodies, characters, starships, battles, speciesList, droids, arsenalList],
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
          { name: 'species.names.en', weight: 3 },
          { name: 'species.names.tr', weight: 3 },
          { name: 'droid.names.en', weight: 3 },
          { name: 'droid.names.tr', weight: 3 },
          { name: 'droid.model', weight: 2 },
          { name: 'item.names.en', weight: 3 },
          { name: 'item.names.tr', weight: 3 },
          { name: 'item.categoryName.en', weight: 2 },
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
          entry.kind === 'body'
            ? entry.body.appearances
            : entry.kind === 'character'
              ? entry.character.appearances
              : entry.kind === 'starship'
                ? entry.starship.appearances
                : entry.kind === 'species'
                  ? entry.species.appearances
                  : entry.kind === 'droid'
                    ? entry.droid.appearances
                    : entry.kind === 'arsenal'
                      ? entry.item.appearances
                      : entry.battle.appearances
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
  const speciesEntries = results.filter((e): e is Extract<Entry, { kind: 'species' }> => e.kind === 'species')
  const droidEntries = results.filter(
    (e): e is Extract<Entry, { kind: 'droid' }> =>
      e.kind === 'droid' && (!droidClassFilter || e.droid.droidClass === droidClassFilter),
  )
  const arsenalEntries = results.filter(
    (e): e is Extract<Entry, { kind: 'arsenal' }> =>
      e.kind === 'arsenal' && (!arsenalCategoryFilter || e.item.category === arsenalCategoryFilter),
  )

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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
              🚀 {t('starships', lang)}
            </h2>
            <span className="font-hud text-[11px] text-holo-cyan/70">
              {lang === 'tr' ? 'Teknik Dosya & Detaylar İçin Tıklayın' : 'Click for Technical Dossier & Details'}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ships.map(({ starship }) => (
              <button
                key={starship.id}
                type="button"
                onClick={() => {
                  setSelectedStarship(starship)
                }}
                className="group block w-full text-left overflow-hidden rounded-lg border border-white/10 bg-panel/90 transition-all hover:border-holo-cyan/60 hover:shadow-[0_0_25px_rgba(0,240,255,0.18)] focus:outline-none focus:ring-1 focus:ring-holo-cyan"
              >
                <div className="relative aspect-16/9 w-full overflow-hidden bg-black/60">
                  <img
                    src={`/ships/${starship.id}.webp`}
                    alt={L(starship.names, lang)}
                    width={800}
                    height={450}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 rounded border border-holo-cyan/30 bg-black/70 px-2 py-0.5 font-hud text-[9px] text-holo-cyan backdrop-blur-xs">
                    {starship.hyperdriveRating}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="rounded-lg border border-holo-cyan/60 bg-black/80 px-3 py-1 font-hud text-xs tracking-wider text-holo-cyan backdrop-blur-sm shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                      📋 {lang === 'tr' ? 'Teknik Dosya & Detayları Aç' : 'Open Technical Dossier & Details'}
                    </span>
                  </div>
                </div>
                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display text-[14px] tracking-[0.14em] text-holo-cyan group-hover:text-white transition-colors">
                      {L(starship.names, lang)}
                    </div>
                    <StarshipClassIcon
                      starshipClass={starship.starshipClass?.en}
                      className="h-3.5 w-3.5 text-holo-cyan/80 shrink-0"
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {starship.model} · {L(starship.starshipClass, lang)}
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-300 line-clamp-2">
                    {L(starship.desc, lang)}
                  </p>
                  <div className="mt-3 flex justify-between border-t border-white/5 pt-2 text-[11px] text-slate-400">
                    <span className="truncate">{L(starship.manufacturer, lang)}</span>
                    <span className="shrink-0 font-hud text-star-gold">{starship.lengthMeters}m</span>
                  </div>
                </div>
              </button>
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
                className="group overflow-hidden rounded-lg border border-sith-red/30 bg-panel/90 transition-all hover:border-sith-red/60"
              >
                <div className="relative aspect-16/9 w-full overflow-hidden bg-black/60">
                  <img
                    src={`/battles/${battle.id}.webp`}
                    alt={L(battle.names, lang)}
                    width={800}
                    height={450}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2 right-2 rounded border border-star-gold/40 bg-black/80 px-2 py-0.5 font-hud text-[10px] text-star-gold backdrop-blur-xs">
                    {battle.yearLabel}
                  </span>
                </div>
                <div className="p-3.5">
                  <div className="font-display text-[14px] tracking-[0.14em] text-red-400">
                    {L(battle.names, lang)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    📍 {L(battle.locationName, lang)}
                  </div>
                  <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                    {L(battle.desc, lang)}
                  </p>
                </div>
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

      {/* Sentient Species & Xenobiology Section */}
      {speciesEntries.length > 0 && (
        <section className="mb-12">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
              🧬 {lang === 'tr' ? 'Galaktik Irklar & Ksenobiyoloji' : 'Sentient Species & Xenobiology'}
            </h2>
            <span className="font-hud text-[11px] text-holo-cyan/70">
              {lang === 'tr' ? 'Ksenobiyoloji Dosyası İçin Tıklayın' : 'Click for Xenobiology Dossier'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {speciesEntries.map(({ species }) => (
              <button
                key={species.id}
                type="button"
                onClick={() => setSelectedSpecies(species)}
                className="group block w-full text-left overflow-hidden rounded-lg border border-white/10 bg-panel/90 transition-all hover:border-holo-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] focus:outline-none focus:ring-1 focus:ring-holo-cyan"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/60">
                  <img
                    src={`/species/${species.id}.webp`}
                    alt={L(species.names, lang)}
                    width={400}
                    height={500}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 rounded border border-white/10 bg-black/70 px-1.5 py-0.5 font-hud text-[8px] text-slate-300 backdrop-blur-xs">
                    {L(species.classification, lang).split(' ')[0]}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 rounded border border-holo-cyan/30 bg-black/75 px-2 py-1 backdrop-blur-xs">
                    <div className="font-display text-[12px] tracking-wide text-slate-100 truncate">
                      {L(species.names, lang)}
                    </div>
                    <div className="text-[10px] text-holo-cyan truncate">
                      🪐 {L(species.homeworldName, lang)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Droid Directory & Classifications Section */}
      {droidEntries.length > 0 && (
        <section className="mb-12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
                🤖 {lang === 'tr' ? 'Droid Rehberi & Sınıflandırma' : 'Droid Directory & Classifications'}
              </h2>
              <span className="font-hud text-[11px] text-holo-cyan/70">
                {lang === 'tr' ? 'Teknik Şasi & Vokabülatör İçin Tıklayın' : 'Click for Technical Chassis & Vocabulator'}
              </span>
            </div>

            {/* Droid Class Filter Badges */}
            <div className="flex flex-wrap gap-1 text-[10px] font-hud">
              {[
                { id: '', label: lang === 'tr' ? 'Tümü' : 'All' },
                { id: 'class-1', label: lang === 'tr' ? 'Sınıf I (Tıbbi)' : 'Class I (Medical)' },
                { id: 'class-2', label: lang === 'tr' ? 'Sınıf II (Astromek)' : 'Class II (Astromech)' },
                { id: 'class-3', label: lang === 'tr' ? 'Sınıf III (Protokol)' : 'Class III (Protocol)' },
                { id: 'class-4', label: lang === 'tr' ? 'Sınıf IV (Askeri)' : 'Class IV (Military)' },
                { id: 'class-5', label: lang === 'tr' ? 'Sınıf V (İş/Güç)' : 'Class V (Utility)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDroidClassFilter(c.id)}
                  className={`rounded px-2 py-0.5 transition-colors ${
                    droidClassFilter === c.id
                      ? 'border border-holo-cyan/50 bg-holo-cyan/20 text-holo-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'border border-white/10 bg-black/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {droidEntries.map(({ droid }) => (
              <button
                key={droid.id}
                type="button"
                onClick={() => setSelectedDroid(droid)}
                className="group block w-full text-left overflow-hidden rounded-lg border border-white/10 bg-panel/90 transition-all hover:border-holo-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] focus:outline-none focus:ring-1 focus:ring-holo-cyan"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/60">
                  <img
                    src={`/droids/${droid.id}.webp`}
                    alt={L(droid.names, lang)}
                    width={400}
                    height={500}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 rounded border border-white/10 bg-black/70 px-1.5 py-0.5 font-hud text-[8px] text-holo-cyan backdrop-blur-xs">
                    {droid.droidClass.toUpperCase()}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 rounded border border-holo-cyan/30 bg-black/75 px-2 py-1 backdrop-blur-xs">
                    <div className="font-display text-[12px] tracking-wide text-slate-100 truncate">
                      {L(droid.names, lang)}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      ⚙️ {droid.model}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedStarship && (
        <StarshipModal
          starship={selectedStarship}
          onClose={() => setSelectedStarship(null)}
          lang={lang}
        />
      )}

      {selectedSpecies && (
        <SpeciesModal
          species={selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
          lang={lang}
        />
      )}

      {/* Galactic Arsenal & Superweapons Section */}
      {arsenalEntries.length > 0 && (
        <section className="mb-12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
                ⚔️ {lang === 'tr' ? 'Galaktik Cephanelik & Süper Silahlar' : 'Galactic Arsenal & Superweapons'}
              </h2>
              <span className="font-hud text-[11px] text-holo-cyan/70">
                {lang === 'tr' ? 'Teknik Dosya & Detaylar İçin Tıklayın' : 'Click for Technical Dossier & Details'}
              </span>
            </div>

            {/* Category Filter Badges */}
            <div className="flex flex-wrap gap-1 text-[10px] font-hud">
              {[
                { id: '', label: lang === 'tr' ? 'Tümü' : 'All' },
                { id: 'blaster', label: lang === 'tr' ? 'Blasterlar' : 'Blasters' },
                { id: 'heavy-weapon', label: lang === 'tr' ? 'Ağır Silahlar' : 'Heavy' },
                { id: 'melee-exotic', label: lang === 'tr' ? 'Egzotik / Kılıç' : 'Melee/Exotic' },
                { id: 'material-armor', label: lang === 'tr' ? 'Maden / Zırh' : 'Armor & Ore' },
                { id: 'superweapon', label: lang === 'tr' ? 'Süper Silahlar' : 'Superweapons' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setArsenalCategoryFilter(c.id)}
                  className={`rounded px-2 py-0.5 transition-colors ${
                    arsenalCategoryFilter === c.id
                      ? 'border border-holo-cyan/50 bg-holo-cyan/20 text-holo-cyan shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                      : 'border border-white/10 bg-black/40 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {arsenalEntries.map(({ item }) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedArsenalItem(item)}
                className="group block w-full text-left overflow-hidden rounded-lg border border-white/10 bg-panel/90 transition-all hover:border-holo-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)] focus:outline-none focus:ring-1 focus:ring-holo-cyan"
              >
                <div className="relative aspect-16/9 w-full overflow-hidden bg-black/60">
                  <img
                    src={`/arsenal/${item.id}.webp`}
                    alt={L(item.names, lang)}
                    width={800}
                    height={450}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 rounded border border-white/10 bg-black/70 px-1.5 py-0.5 font-hud text-[8px] text-star-gold backdrop-blur-xs">
                    {L(item.categoryName, lang)}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 rounded border border-holo-cyan/30 bg-black/75 px-2.5 py-1.5 backdrop-blur-xs">
                    <div className="font-display text-[13px] tracking-wide text-slate-100 truncate">
                      {L(item.names, lang)}
                    </div>
                    <div className="text-[10px] text-holo-cyan truncate">
                      ⚡ {L(item.manufacturerOrOrigin, lang)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedStarship && (
        <StarshipModal
          starship={selectedStarship}
          onClose={() => setSelectedStarship(null)}
          lang={lang}
        />
      )}

      {selectedSpecies && (
        <SpeciesModal
          species={selectedSpecies}
          onClose={() => setSelectedSpecies(null)}
          lang={lang}
        />
      )}

      {selectedDroid && (
        <DroidModal
          droid={selectedDroid}
          onClose={() => setSelectedDroid(null)}
          lang={lang}
        />
      )}

      {selectedArsenalItem && (
        <ArsenalModal
          item={selectedArsenalItem}
          onClose={() => setSelectedArsenalItem(null)}
          lang={lang}
        />
      )}
    </HolocronChrome>
  )
}

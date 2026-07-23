// Holocron index: every world and figure in the archive as one searchable
// grid. Search runs over both languages at once through Fuse, so a Turkish
// speaker can still find "Ölüm Yıldızı" by typing "death star".

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import Fuse from 'fuse.js'
import type { CelestialBody, Character } from '../types/lore'
import { L, loadAllPlanets, loadCharacters, media, regions, stations } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import HoloPortrait from '../components/HoloPortrait'
import HolocronChrome from '../components/HolocronChrome'

type Entry =
  | { kind: 'body'; id: string; body: CelestialBody }
  | { kind: 'character'; id: string; character: Character }

function bodyEntries(bodies: CelestialBody[]): Entry[] {
  return bodies.map((body) => ({ kind: 'body', id: body.id, body }))
}

export default function Holocron() {
  const lang = useApp((s) => s.lang)
  const [bodies, setBodies] = useState<CelestialBody[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('')
  const [mediaId, setMediaId] = useState('')

  useEffect(() => {
    loadAllPlanets().then((planets) => {
      const moons = planets.flatMap((p) => p.moonsDetail ?? [])
      setBodies([...planets, ...moons, ...stations])
    })
    loadCharacters().then(setCharacters)
  }, [])

  const entries = useMemo<Entry[]>(
    () => [
      ...bodyEntries(bodies),
      ...characters.map((character) => ({ kind: 'character' as const, id: character.id, character })),
    ],
    [bodies, characters],
  )

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        threshold: 0.34,
        ignoreLocation: true,
        keys: [
          { name: 'body.names.en', weight: 3 },
          { name: 'body.names.tr', weight: 3 },
          { name: 'body.desc.en', weight: 1 },
          { name: 'body.desc.tr', weight: 1 },
          { name: 'body.system', weight: 1 },
          { name: 'character.names.en', weight: 3 },
          { name: 'character.names.tr', weight: 3 },
          { name: 'character.aka', weight: 2 },
          { name: 'character.species.en', weight: 1 },
          { name: 'character.species.tr', weight: 1 },
          { name: 'character.bio.en', weight: 1 },
          { name: 'character.bio.tr', weight: 1 },
        ],
      }),
    [entries],
  )

  const results = useMemo(() => {
    const base = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : entries
    return base.filter((entry) => {
      if (region) {
        const entryRegion = entry.kind === 'body' ? entry.body.region : undefined
        if (entryRegion !== region) return false
      }
      if (mediaId) {
        const appearances =
          entry.kind === 'body' ? entry.body.appearances : entry.character.appearances
        if (!appearances.includes(mediaId)) return false
      }
      return true
    })
  }, [query, region, mediaId, fuse, entries])

  const worlds = results.filter((e): e is Extract<Entry, { kind: 'body' }> => e.kind === 'body')
  const figures = results.filter(
    (e): e is Extract<Entry, { kind: 'character' }> => e.kind === 'character',
  )

  return (
    <HolocronChrome>
      <header className="mb-8">
        <h1 className="font-display text-3xl tracking-[0.22em] text-star-gold">
          {t('holocron', lang).toUpperCase()}
        </h1>
        <p className="mt-2 font-hud text-[13px] tracking-wide text-slate-400">
          {t('holocronIntro', lang)}
        </p>
      </header>

      <div className="mb-8 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder', lang)}
          aria-label={t('search', lang)}
          className="min-w-[240px] flex-1 rounded border border-white/10 bg-panel/80 px-3 py-2 text-[13px] text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-holo-cyan/60"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label={t('region', lang)}
          className="rounded border border-white/10 bg-panel/80 px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-holo-cyan/60"
        >
          <option value="">{t('allRegions', lang)}</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {L(r.names, lang)}
            </option>
          ))}
        </select>
        <select
          value={mediaId}
          onChange={(e) => setMediaId(e.target.value)}
          aria-label={t('appearances', lang)}
          className="rounded border border-white/10 bg-panel/80 px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-holo-cyan/60"
        >
          <option value="">{t('allMedia', lang)}</option>
          {media.map((m) => (
            <option key={m.id} value={m.id}>
              {L(m.title, lang)}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-4 font-hud text-[11px] uppercase tracking-[0.3em] text-slate-500">
        {results.length} {t('resultCount', lang)}
      </p>

      {results.length === 0 && (
        <p className="py-12 text-center text-[13px] text-slate-500">{t('noResults', lang)}</p>
      )}

      {worlds.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-500">
            {t('worlds', lang)}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {worlds.map(({ body }) => {
              const { primary, secondary } = body.renderRecipe.palette
              return (
                <Link
                  key={body.id}
                  to={`/holocron/planet/${body.id}`}
                  className="group overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-holo-cyan/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-cyan"
                >
                  <div
                    className="h-24 w-full transition-transform duration-500 group-hover:scale-105"
                    style={{
                      background: `radial-gradient(120% 130% at 32% 26%, ${primary} 0%, ${secondary ?? primary} 58%, #05070c 100%)`,
                    }}
                  />
                  <div className="bg-panel/90 px-2.5 py-2">
                    <div className="font-display text-[12px] tracking-[0.16em] text-slate-100">
                      {L(body.names, lang).toUpperCase()}
                    </div>
                    <div className="mt-0.5 font-hud text-[10px] tracking-[0.18em] text-slate-500">
                      {L(regions.find((r) => r.id === body.region)?.names, lang)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {figures.length > 0 && (
        <section>
          <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-500">
            {t('characters', lang)}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {figures.map(({ character }) => (
              <Link
                key={character.id}
                to={`/holocron/character/${character.id}`}
                className="group overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-holo-cyan/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holo-cyan"
              >
                <HoloPortrait id={character.id} name={L(character.names, lang)} size="sm" />
                <div className="bg-panel/90 px-2.5 py-2">
                  <div className="font-display text-[12px] tracking-[0.14em] text-slate-100">
                    {L(character.names, lang)}
                  </div>
                  <div className="mt-0.5 font-hud text-[10px] tracking-[0.18em] text-slate-500">
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

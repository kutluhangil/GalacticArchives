// Side-by-side comparison: Planets (live globes & scale), Systems (the star
// system around each world), Characters (holo-portraits & bio), and Starships
// (tech specs & relative scale).
//
// Up to four columns rather than a fixed pair: the archive's own worlds argue
// for it (three Death Star-adjacent bodies, four desert worlds), and the URL
// carries the whole set so a comparison stays shareable. Four is the ceiling
// because each planet column builds its own WebGL scene.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { CelestialBody, Character, EraId, Starship } from '../types/lore'
import { PlanetEngine } from '../lib/engine/planet-engine'
import { simClock } from '../lib/sim-clock'
import {
  L,
  LL,
  factionById,
  loadAllPlanets,
  loadBody,
  loadCharacters,
  loadStarships,
  regions,
  systemFacts,
} from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import EraDissolve from '../components/EraDissolve'
import { useEraDissolve } from '../components/useEraDissolve'
import SourceLink from '../components/SourceLink'
import HoloPortrait from '../components/HoloPortrait'
import SystemSchematic from '../components/SystemSchematic'
import { sfx } from '../lib/audio'

const MODES = ['planets', 'systems', 'characters', 'starships'] as const
type Mode = (typeof MODES)[number]

/** each planet column builds its own WebGL scene, and past four the table stops
 *  being readable on a laptop */
const MAX_COLUMNS = 4

/** one tint per column, so the scale discs stay tellable apart */
const COLUMN_TINTS = ['#66D9FF', '#FFE81F', '#A78BFA', '#4ADE80']

function GlobePane({ body, era }: { body: CelestialBody; era: EraId }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dissolve = useEraDissolve()

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new PlanetEngine(canvasRef.current, {
      getSimTime: () => simClock.getTime(),
    })
    engine.init(body, era)
    dissolve.onBuild(body.id)
    return () => {
      dissolve.onTeardown(engine)
      engine.dispose()
    }
    // dissolve helpers are stable refs; excluding them keeps the rebuild keyed
    // strictly to body/era
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, era])

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" />
      {dissolve.snap && (
        <EraDissolve key={dissolve.snap} src={dissolve.snap} onDone={dissolve.clear} />
      )}
    </div>
  )
}

/** the row of pickers above every mode: one select per column, plus the add and
 *  remove controls that make the set variable rather than a fixed pair */
function ColumnPickers({
  ids,
  options,
  onChange,
}: {
  ids: string[]
  options: { id: string; name: string }[]
  onChange: (ids: string[]) => void
}) {
  const lang = useApp((s) => s.lang)
  const unused = options.find((o) => !ids.includes(o.id))

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {ids.map((id, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span className="font-hud text-[10px] uppercase tracking-[0.2em] text-slate-500">
            {String.fromCharCode(65 + index)}
          </span>
          <select
            value={id}
            aria-label={`${t('compare', lang)} ${String.fromCharCode(65 + index)}`}
            onChange={(e) => onChange(ids.map((v, i) => (i === index ? e.target.value : v)))}
            className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-slate-200 outline-hidden"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          {ids.length > 2 && (
            <button
              onClick={() => {
                sfx.playHover()
                onChange(ids.filter((_, i) => i !== index))
              }}
              aria-label={t('compareRemove', lang)}
              className="rounded px-1 text-[12px] text-slate-500 transition-colors hover:text-red-300"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {ids.length < MAX_COLUMNS && unused && (
        <button
          onClick={() => {
            sfx.playSelect()
            onChange([...ids, unused.id])
          }}
          className="rounded border border-holo-cyan/30 bg-holo-cyan/10 px-2 py-1 font-hud text-[10px] uppercase tracking-wider text-holo-cyan transition-colors hover:bg-holo-cyan/20"
        >
          + {t('compareAdd', lang)}
        </button>
      )}
      {ids.length === MAX_COLUMNS && (
        <span className="font-hud text-[10px] uppercase tracking-wider text-slate-600">
          {t('compareFull', lang)}
        </span>
      )}
    </div>
  )
}

/** the fact table under the columns: one header per column, one row per fact */
function FactTable({
  keys,
  headers,
  rows,
}: {
  keys: string[]
  headers: (string | undefined)[]
  rows: { label: string; values: (string | undefined)[] }[]
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[520px] text-[12px]">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
            <th className="w-1/4 pb-2 font-normal" />
            {headers.map((header, i) => (
              <th key={keys[i] ?? i} className="pb-2 font-normal">
                {header ?? ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-white/5 align-top">
              <td className="py-2 pr-3 text-slate-500">{row.label}</td>
              {row.values.map((value, i) => (
                <td key={keys[i] ?? i} className="py-2 pr-3 text-slate-200">
                  {value || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function regionNameFor(body: CelestialBody | null, lang: 'en' | 'tr'): string | undefined {
  const region = regions.find((r) => r.id === body?.region)
  return region ? L(region.names, lang) : undefined
}

export default function Compare() {
  const lang = useApp((s) => s.lang)
  const era = useApp((s) => s.era)
  const legends = useApp((s) => s.legends)
  const [params, setParams] = useSearchParams()

  // the mode rides in the URL with the set, so a system comparison is as
  // shareable as a planet one, and switching tabs cannot leave the previous
  // mode's ids behind
  const modeParam = params.get('mode')
  const mode: Mode = (MODES as readonly string[]).includes(modeParam ?? '')
    ? (modeParam as Mode)
    : 'planets'

  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [starships, setStarships] = useState<Starship[]>([])

  const [bodies, setBodies] = useState<(CelestialBody | null)[]>([])

  const defaults: Record<Mode, string[]> = {
    planets: ['coruscant', 'tatooine'],
    // a twin-sun system against a gas giant with twenty-six moons
    systems: ['tatooine', 'yavin'],
    characters: ['luke-skywalker', 'darth-vader'],
    starships: ['millennium-falcon', 'imperial-star-destroyer'],
  }

  // `ids` carries the set; `a`/`b` are still read so links shared before this
  // page grew past two columns keep working
  const ids = useMemo(() => {
    const listed = params.get('ids')?.split(',').filter(Boolean)
    const pair = [params.get('a'), params.get('b')].filter(Boolean) as string[]
    const chosen = listed?.length ? listed : pair.length ? pair : defaults[mode]
    return chosen.slice(0, MAX_COLUMNS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, mode])

  const setIds = (next: string[]) => setParams({ mode, ids: next.join(',') })

  /** a mode change starts that mode's own set: character ids mean nothing to
   *  the planet columns */
  const setMode = (next: Mode) => setParams({ mode: next, ids: defaults[next].join(',') })

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
    loadCharacters().then(setCharacters)
    loadStarships().then(setStarships)
  }, [])

  const selectablePlanets = useMemo(
    () => planets.filter((p) => legends || p.continuity !== 'legends'),
    [planets, legends],
  )

  /** the system picker names systems, not worlds — the column is the system */
  const systemOptions = useMemo(
    () =>
      selectablePlanets
        .map((p) => ({ id: p.id, name: p.system }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [selectablePlanets],
  )

  useEffect(() => {
    // both world modes need the full record: the globe for its recipe, the
    // system for its suns, moons and stations
    if (mode !== 'planets' && mode !== 'systems') return
    let cancelled = false
    Promise.all(ids.map((id) => loadBody(id).catch(() => null)))
      .then((loaded) => {
        if (!cancelled) setBodies(loaded)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ids, mode])

  const chosenCharacters = useMemo(
    () => ids.map((id, i) => characters.find((c) => c.id === id) ?? characters[i]).filter(Boolean),
    [characters, ids],
  )

  const chosenShips = useMemo(
    () => ids.map((id, i) => starships.find((s) => s.id === id) ?? starships[i]).filter(Boolean),
    [starships, ids],
  )

  /** each value against the largest in the set, so the columns share one scale */
  const fractions = (values: (number | undefined)[]) => {
    const max = Math.max(...values.map((v) => v ?? 0), 1)
    return values.map((v) => (v ?? 0) / max)
  }

  const planetScale = useMemo(
    () => fractions(bodies.map((b) => b?.stats?.diameterKm)),
    [bodies],
  )

  const shipScale = useMemo(
    () => fractions(chosenShips.map((s) => s?.lengthMeters)),
    [chosenShips],
  )

  const diameters = bodies.map((b) =>
    b?.stats?.diameterKm ? `${b.stats.diameterKm.toLocaleString(lang)} km` : undefined,
  )

  const planetRows: { label: string; values: (string | undefined)[] }[] = [
    { label: t('diameter', lang), values: diameters },
    { label: t('region', lang), values: bodies.map((b) => regionNameFor(b, lang)) },
    { label: t('climate', lang), values: bodies.map((b) => LL(b?.climate, lang).join(' · ')) },
    { label: t('terrain', lang), values: bodies.map((b) => LL(b?.terrain, lang).join(' · ')) },
    {
      label: t('population', lang),
      values: bodies.map((b) => (b?.stats?.population ? L(b.stats.population, lang) : undefined)),
    },
  ]

  const facts = useMemo(
    () => bodies.map((b) => (b ? systemFacts(b, era, lang) : null)),
    [bodies, era, lang],
  )

  const systemRows: { label: string; values: (string | undefined)[] }[] = [
    { label: t('system', lang), values: facts.map((f) => f?.name) },
    {
      label: t('suns', lang),
      values: facts.map((f) =>
        f?.suns.length ? `${f.suns.length} · ${f.suns.map((s) => s.name).join(' · ')}` : undefined,
      ),
    },
    {
      label: t('moons', lang),
      values: facts.map((f) => (f?.moonCount != null ? String(f.moonCount) : undefined)),
    },
    {
      label: t('namedMoons', lang),
      values: facts.map((f) => (f?.namedMoons.length ? f.namedMoons.join(' · ') : undefined)),
    },
    {
      label: t('stations', lang),
      values: facts.map((f) =>
        f?.stations.length ? f.stations.map((s) => L(s.names, lang)).join(' · ') : undefined,
      ),
    },
    { label: t('diameter', lang), values: diameters },
    { label: t('region', lang), values: bodies.map((b) => regionNameFor(b, lang)) },
    { label: t('sector', lang), values: bodies.map((b) => b?.sector) },
    {
      label: t('affiliation', lang),
      values: bodies.map((b) => {
        const faction = factionById(b?.affiliationsByEra?.[era])
        return faction ? L(faction.names, lang) : undefined
      }),
    },
  ]

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-space">
      <TopBar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-2xl tracking-[0.25em] text-slate-100">
            {t('compare', lang).toUpperCase()}
          </h1>

          <div className="flex rounded border border-white/10 bg-black/40 p-0.5">
            {[
              { id: 'planets' as const, label: t('planets', lang) },
              { id: 'systems' as const, label: t('systems', lang) },
              { id: 'characters' as const, label: t('characters', lang) },
              { id: 'starships' as const, label: t('starships', lang) },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  sfx.playHover()
                  setMode(m.id)
                }}
                className={`rounded px-3 py-1 font-hud text-[11px] uppercase tracking-wider transition-colors ${
                  mode === m.id ? 'bg-holo-cyan/20 text-holo-cyan' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'planets' && (
          <>
            <ColumnPickers
              ids={ids}
              options={selectablePlanets.map((p) => ({ id: p.id, name: L(p.names, lang) }))}
              onChange={setIds}
            />

            <div
              className="mt-4 grid gap-3"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))` }}
            >
              {bodies.map((body, i) => (
                <div
                  key={ids[i] ?? i}
                  className="relative h-[300px] overflow-hidden rounded-lg border border-holo-cyan/15 bg-black/40"
                >
                  {body && <GlobePane body={body} era={era} />}
                  <span className="absolute bottom-2 left-3 font-display text-sm tracking-[0.2em] text-slate-200">
                    {body ? L(body.names, lang).toUpperCase() : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-panel/60 p-4">
              <div className="mb-3 font-hud text-[10px] uppercase tracking-[0.3em] text-slate-500">
                {t('toScale', lang)}
              </div>
              <div className="flex flex-wrap items-end justify-center gap-8">
                {bodies.map((body, i) => (
                  <div key={ids[i] ?? i} className="flex flex-col items-center gap-2">
                    <span
                      className="block rounded-full"
                      style={{
                        width: `${Math.max((planetScale[i] ?? 0) * 160, 12)}px`,
                        height: `${Math.max((planetScale[i] ?? 0) * 160, 12)}px`,
                        background: `radial-gradient(circle at 35% 30%, ${COLUMN_TINTS[i % COLUMN_TINTS.length]}, #0b1018 70%)`,
                      }}
                    />
                    <span className="text-[11px] text-slate-400">
                      {body?.stats?.diameterKm
                        ? `${body.stats.diameterKm.toLocaleString(lang)} km`
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <FactTable
              keys={ids}
              headers={bodies.map((body) => (body ? L(body.names, lang) : ''))}
              rows={planetRows}
            />
          </>
        )}

        {mode === 'systems' && (
          <>
            <ColumnPickers
              ids={ids}
              options={systemOptions}
              onChange={setIds}
            />

            <div
              className="mt-4 grid gap-3"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))` }}
            >
              {bodies.map((body, i) => (
                <div
                  key={ids[i] ?? i}
                  className="rounded-lg border border-holo-cyan/15 bg-black/40 p-3"
                >
                  <div className="h-[110px]">
                    {body && (
                      <SystemSchematic
                        suns={body.suns ?? []}
                        // the canon figure first: Yavin names one moon and
                        // counts twenty-six, and the sketch should show a
                        // crowded orbit either way
                        moonDots={facts[i]?.moonCount ?? facts[i]?.namedMoons.length ?? 0}
                        hasStation={Boolean(facts[i]?.stations.length)}
                        fraction={planetScale[i] ?? 0}
                        primaryColor={body.renderRecipe.palette.primary}
                      />
                    )}
                  </div>
                  <div className="mt-2 font-display text-sm tracking-[0.2em] text-slate-200">
                    {facts[i]?.name.toUpperCase() ?? ''}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {body ? L(body.names, lang) : ''}
                  </div>
                </div>
              ))}
            </div>

            <FactTable
              keys={ids}
              headers={bodies.map((body) => (body ? L(body.names, lang) : ''))}
              rows={systemRows}
            />
          </>
        )}

        {mode === 'characters' && (
          <div className="mt-2">
            <ColumnPickers
              ids={ids}
              options={characters.map((c) => ({ id: c.id, name: L(c.names, lang) }))}
              onChange={setIds}
            />

            <div
              className="mt-6 grid gap-6"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))` }}
            >
              {chosenCharacters.map((char) => (
                <div key={char.id} className="rounded-lg border border-holo-cyan/20 bg-panel/80 p-4">
                  <HoloPortrait id={char.id} name={L(char.names, lang)} size="md" />
                  <h3 className="mt-3 font-display text-lg tracking-wider text-slate-100">
                    {L(char.names, lang)}
                  </h3>
                  <div className="mt-1 font-hud text-[11px] text-holo-cyan">
                    {L(char.species, lang)}
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-slate-300">
                    {L(char.bio, lang)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'starships' && (
          <div className="mt-2">
            <ColumnPickers
              ids={ids}
              options={starships.map((s) => ({ id: s.id, name: L(s.names, lang) }))}
              onChange={setIds}
            />

            <div className="mb-6 mt-6 rounded-lg border border-white/10 bg-panel/60 p-4">
              <div className="mb-3 font-hud text-[10px] uppercase tracking-[0.3em] text-slate-500">
                {t('toScale', lang)} ({lang === 'tr' ? 'UZUNLUK' : 'LENGTH'})
              </div>
              <div className="space-y-3">
                {chosenShips.map((ship, i) => (
                  <div key={ship.id} className="flex items-center gap-3">
                    <span className="w-32 truncate text-[11px] text-slate-300">
                      {L(ship.names, lang)}
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded bg-black/50">
                      <div
                        className="h-full bg-linear-to-r from-holo-cyan to-star-gold transition-all duration-500"
                        style={{ width: `${Math.max((shipScale[i] ?? 0) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-[11px] text-star-gold">
                      {ship.lengthMeters ? `${ship.lengthMeters} m` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))` }}
            >
              {chosenShips.map((ship) => (
                <div key={ship.id} className="rounded-lg border border-white/10 bg-panel/80 p-4">
                  <h3 className="font-display text-lg tracking-wider text-holo-cyan">
                    {L(ship.names, lang)}
                  </h3>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {ship.model} · {L(ship.starshipClass, lang)}
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-slate-300">
                    {L(ship.desc, lang)}
                  </p>
                  <div className="mt-4 space-y-1 border-t border-white/5 pt-3 text-[11px] text-slate-400">
                    <div>
                      <strong className="text-slate-300">{t('manufacturer', lang)}:</strong>{' '}
                      {L(ship.manufacturer, lang)}
                    </div>
                    <div>
                      <strong className="text-slate-300">{t('hyperdrive', lang)}:</strong>{' '}
                      {ship.hyperdriveRating}
                    </div>
                    <div>
                      <strong className="text-slate-300">
                        {lang === 'tr' ? 'Mürettebat' : 'Crew'}:
                      </strong>{' '}
                      {ship.crew}
                    </div>
                  </div>
                  <SourceLink source={ship.source} className="mt-3" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

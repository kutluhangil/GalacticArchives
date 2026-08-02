// Side-by-side comparison: Planets (live globes & scale), Characters (holo-portraits & bio),
// and Starships (tech specs & relative scale).

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { CelestialBody, Character, EraId, Starship } from '../types/lore'
import { PlanetEngine } from '../lib/engine/planet-engine'
import { simClock } from '../lib/sim-clock'
import { L, LL, loadAllPlanets, loadBody, loadCharacters, loadStarships, regions } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import EraDissolve from '../components/EraDissolve'
import { useEraDissolve } from '../components/useEraDissolve'
import HoloPortrait from '../components/HoloPortrait'
import { sfx } from '../lib/audio'

type Mode = 'planets' | 'characters' | 'starships'

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

function regionNameFor(body: CelestialBody | null, lang: 'en' | 'tr'): string | undefined {
  const region = regions.find((r) => r.id === body?.region)
  return region ? L(region.names, lang) : undefined
}

export default function Compare() {
  const lang = useApp((s) => s.lang)
  const era = useApp((s) => s.era)
  const legends = useApp((s) => s.legends)
  const [params, setParams] = useSearchParams()
  const [mode, setMode] = useState<Mode>('planets')

  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [starships, setStarships] = useState<Starship[]>([])

  const [leftPlanet, setLeftPlanet] = useState<CelestialBody | null>(null)
  const [rightPlanet, setRightPlanet] = useState<CelestialBody | null>(null)

  const leftId = params.get('a') ?? (mode === 'planets' ? 'coruscant' : mode === 'characters' ? 'luke-skywalker' : 'millennium-falcon')
  const rightId = params.get('b') ?? (mode === 'planets' ? 'tatooine' : mode === 'characters' ? 'darth-vader' : 'imperial-star-destroyer')

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
    loadCharacters().then(setCharacters)
    loadStarships().then(setStarships)
  }, [])

  const selectablePlanets = useMemo(
    () => planets.filter((p) => legends || p.continuity !== 'legends'),
    [planets, legends],
  )

  useEffect(() => {
    if (mode !== 'planets') return
    let cancelled = false
    Promise.all([loadBody(leftId), loadBody(rightId)]).then(([a, b]) => {
      if (cancelled) return
      setLeftPlanet(a)
      setRightPlanet(b)
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [leftId, rightId, mode])

  const leftChar = useMemo(() => characters.find((c) => c.id === leftId) ?? characters[0], [characters, leftId])
  const rightChar = useMemo(() => characters.find((c) => c.id === rightId) ?? characters[1], [characters, rightId])

  const leftShip = useMemo(() => starships.find((s) => s.id === leftId) ?? starships[0], [starships, leftId])
  const rightShip = useMemo(() => starships.find((s) => s.id === rightId) ?? starships[1], [starships, rightId])

  const planetScale = useMemo(() => {
    const a = leftPlanet?.stats?.diameterKm ?? 0
    const b = rightPlanet?.stats?.diameterKm ?? 0
    const max = Math.max(a, b, 1)
    return { a: a / max, b: b / max }
  }, [leftPlanet, rightPlanet])

  const shipScale = useMemo(() => {
    const a = leftShip?.lengthMeters ?? 0
    const b = rightShip?.lengthMeters ?? 0
    const max = Math.max(a, b, 1)
    return { a: a / max, b: b / max }
  }, [leftShip, rightShip])

  const planetRows: { label: string; a?: string; b?: string }[] = [
    {
      label: t('diameter', lang),
      a: leftPlanet?.stats?.diameterKm ? `${leftPlanet.stats.diameterKm.toLocaleString(lang)} km` : undefined,
      b: rightPlanet?.stats?.diameterKm ? `${rightPlanet.stats.diameterKm.toLocaleString(lang)} km` : undefined,
    },
    { label: t('region', lang), a: regionNameFor(leftPlanet, lang), b: regionNameFor(rightPlanet, lang) },
    { label: t('climate', lang), a: LL(leftPlanet?.climate, lang).join(' · '), b: LL(rightPlanet?.climate, lang).join(' · ') },
    { label: t('terrain', lang), a: LL(leftPlanet?.terrain, lang).join(' · '), b: LL(rightPlanet?.terrain, lang).join(' · ') },
    {
      label: t('population', lang),
      a: leftPlanet?.stats?.population ? L(leftPlanet.stats.population, lang) : undefined,
      b: rightPlanet?.stats?.population ? L(rightPlanet.stats.population, lang) : undefined,
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
            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="uppercase tracking-[0.2em] text-slate-500">A</span>
                <select
                  value={leftId}
                  onChange={(e) => setParams({ a: e.target.value, b: rightId })}
                  className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-slate-200 outline-none"
                >
                  {selectablePlanets.map((p) => (
                    <option key={p.id} value={p.id}>{L(p.names, lang)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="uppercase tracking-[0.2em] text-slate-500">B</span>
                <select
                  value={rightId}
                  onChange={(e) => setParams({ a: leftId, b: e.target.value })}
                  className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-slate-200 outline-none"
                >
                  {selectablePlanets.map((p) => (
                    <option key={p.id} value={p.id}>{L(p.names, lang)}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[leftPlanet, rightPlanet].map((body, i) => (
                <div key={i} className="relative h-[300px] overflow-hidden rounded-lg border border-holo-cyan/15 bg-black/40">
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
              <div className="flex items-end justify-center gap-8">
                {[
                  { body: leftPlanet, frac: planetScale.a, tint: '#66D9FF' },
                  { body: rightPlanet, frac: planetScale.b, tint: '#FFE81F' },
                ].map(({ body, frac, tint }, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span
                      className="block rounded-full"
                      style={{
                        width: `${Math.max(frac * 160, 12)}px`,
                        height: `${Math.max(frac * 160, 12)}px`,
                        background: `radial-gradient(circle at 35% 30%, ${tint}, #0b1018 70%)`,
                      }}
                    />
                    <span className="text-[11px] text-slate-400">
                      {body?.stats?.diameterKm ? `${body.stats.diameterKm.toLocaleString(lang)} km` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <table className="mt-6 w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <th className="w-1/4 pb-2 font-normal" />
                  <th className="pb-2 font-normal">{leftPlanet ? L(leftPlanet.names, lang) : ''}</th>
                  <th className="pb-2 font-normal">{rightPlanet ? L(rightPlanet.names, lang) : ''}</th>
                </tr>
              </thead>
              <tbody>
                {planetRows.map((row) => (
                  <tr key={row.label} className="border-t border-white/5 align-top">
                    <td className="py-2 pr-3 text-slate-500">{row.label}</td>
                    <td className="py-2 pr-3 text-slate-200">{row.a ?? '—'}</td>
                    <td className="py-2 text-slate-200">{row.b ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {mode === 'characters' && (
          <div className="mt-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={leftChar?.id}
                onChange={(e) => setParams({ a: e.target.value, b: rightChar?.id ?? '' })}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5 text-[12px] text-slate-200 outline-none"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{L(c.names, lang)}</option>
                ))}
              </select>
              <select
                value={rightChar?.id}
                onChange={(e) => setParams({ a: leftChar?.id ?? '', b: e.target.value })}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5 text-[12px] text-slate-200 outline-none"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>{L(c.names, lang)}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[leftChar, rightChar].map((char) => (
                char && (
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
                )
              ))}
            </div>
          </div>
        )}

        {mode === 'starships' && (
          <div className="mt-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={leftShip?.id}
                onChange={(e) => setParams({ a: e.target.value, b: rightShip?.id ?? '' })}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5 text-[12px] text-slate-200 outline-none"
              >
                {starships.map((s) => (
                  <option key={s.id} value={s.id}>{L(s.names, lang)}</option>
                ))}
              </select>
              <select
                value={rightShip?.id}
                onChange={(e) => setParams({ a: leftShip?.id ?? '', b: e.target.value })}
                className="rounded border border-white/10 bg-black/40 px-3 py-1.5 text-[12px] text-slate-200 outline-none"
              >
                {starships.map((s) => (
                  <option key={s.id} value={s.id}>{L(s.names, lang)}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-panel/60 p-4 mb-6">
              <div className="mb-3 font-hud text-[10px] uppercase tracking-[0.3em] text-slate-500">
                {t('toScale', lang)} (LENGTH)
              </div>
              <div className="space-y-3">
                {[
                  { ship: leftShip, frac: shipScale.a },
                  { ship: rightShip, frac: shipScale.b },
                ].map(({ ship, frac }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-32 truncate text-[11px] text-slate-300">{ship ? L(ship.names, lang) : ''}</span>
                    <div className="flex-1 h-3 rounded bg-black/50 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-holo-cyan to-star-gold transition-all duration-500"
                        style={{ width: `${Math.max(frac * 100, 2)}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-[11px] text-star-gold">{ship?.lengthMeters ? `${ship.lengthMeters} m` : '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[leftShip, rightShip].map((ship) => (
                ship && (
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
                    <div className="mt-4 border-t border-white/5 pt-3 text-[11px] space-y-1 text-slate-400">
                      <div><strong className="text-slate-300">Manufacturer:</strong> {L(ship.manufacturer, lang)}</div>
                      <div><strong className="text-slate-300">Hyperdrive:</strong> {ship.hyperdriveRating}</div>
                      <div><strong className="text-slate-300">Crew:</strong> {ship.crew}</div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

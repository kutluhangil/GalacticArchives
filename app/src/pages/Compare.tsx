// Side-by-side world comparison: two live globes, a to-scale diameter strip
// and the stat rows that differ. Selection lives in the query string so a
// comparison can be linked.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { CelestialBody, EraId } from '../types/lore'
import { PlanetEngine } from '../lib/engine/planet-engine'
import { simClock } from '../lib/sim-clock'
import { L, LL, loadAllPlanets, loadBody, regions } from '../lib/lore'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'
import TopBar from '../components/hud/TopBar'
import EraDissolve from '../components/EraDissolve'
import { useEraDissolve } from '../components/useEraDissolve'

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
    // dissolve helpers are stable refs; keep the rebuild keyed to body/era only
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

function regionNameFor(body: CelestialBody | null, lang: 'en' | 'tr'): string | undefined {
  const region = regions.find((r) => r.id === body?.region)
  return region ? L(region.names, lang) : undefined
}

function Picker({
  label,
  value,
  planets,
  onChange,
}: {
  label: string
  value: string
  planets: CelestialBody[]
  onChange: (id: string) => void
}) {
  const lang = useApp((s) => s.lang)
  return (
    <label className="flex items-center gap-2 text-[11px] text-slate-400">
      <span className="uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[12px] text-slate-200 outline-none focus:border-holo-cyan/60"
      >
        {planets.map((p) => (
          <option key={p.id} value={p.id} className="bg-space">
            {L(p.names, lang)}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Compare() {
  const lang = useApp((s) => s.lang)
  const era = useApp((s) => s.era)
  const [params, setParams] = useSearchParams()
  const legends = useApp((s) => s.legends)
  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const [left, setLeft] = useState<CelestialBody | null>(null)
  const [right, setRight] = useState<CelestialBody | null>(null)

  const leftId = params.get('a') ?? 'coruscant'
  const rightId = params.get('b') ?? 'tatooine'

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
  }, [])

  // Legends worlds are selectable only when the layer is switched on
  const selectable = useMemo(
    () => planets.filter((p) => legends || p.continuity !== 'legends'),
    [planets, legends],
  )

  useEffect(() => {
    let cancelled = false
    Promise.all([loadBody(leftId), loadBody(rightId)]).then(([a, b]) => {
      if (cancelled) return
      setLeft(a)
      setRight(b)
    })
    return () => {
      cancelled = true
    }
  }, [leftId, rightId])

  const scale = useMemo(() => {
    const a = left?.stats?.diameterKm ?? 0
    const b = right?.stats?.diameterKm ?? 0
    const max = Math.max(a, b, 1)
    return { a: a / max, b: b / max, biggerIsLeft: a >= b }
  }, [left, right])

  const rows: { label: string; a?: string; b?: string }[] = [
    {
      label: t('diameter', lang),
      a: left?.stats?.diameterKm ? `${left.stats.diameterKm.toLocaleString(lang)} km` : undefined,
      b: right?.stats?.diameterKm ? `${right.stats.diameterKm.toLocaleString(lang)} km` : undefined,
    },
    { label: t('region', lang), a: regionNameFor(left, lang), b: regionNameFor(right, lang) },
    { label: t('climate', lang), a: LL(left?.climate, lang).join(' · '), b: LL(right?.climate, lang).join(' · ') },
    { label: t('terrain', lang), a: LL(left?.terrain, lang).join(' · '), b: LL(right?.terrain, lang).join(' · ') },
    {
      label: t('population', lang),
      a: left?.stats?.population ? L(left.stats.population, lang) : undefined,
      b: right?.stats?.population ? L(right.stats.population, lang) : undefined,
    },
    { label: t('suns', lang), a: left?.suns?.map((s) => s.name).join(' · '), b: right?.suns?.map((s) => s.name).join(' · ') },
  ]

  return (
    <div className="relative h-full w-full overflow-y-auto bg-space">
      <TopBar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-24">
        <h1 className="font-display text-2xl tracking-[0.25em] text-slate-100">
          {t('compare', lang).toUpperCase()}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4">
          <Picker
            label="A"
            value={leftId}
            planets={selectable}
            onChange={(id) => setParams({ a: id, b: rightId })}
          />
          <Picker
            label="B"
            value={rightId}
            planets={selectable}
            onChange={(id) => setParams({ a: leftId, b: id })}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[left, right].map((body, i) => (
            <div
              key={i}
              className="relative h-[300px] overflow-hidden rounded-lg border border-holo-cyan/15 bg-black/40"
            >
              {body && <GlobePane body={body} era={era} />}
              <span className="absolute bottom-2 left-3 font-display text-sm tracking-[0.2em] text-slate-200">
                {body ? L(body.names, lang).toUpperCase() : ''}
              </span>
            </div>
          ))}
        </div>

        {/* to-scale strip: circles sized by real diameter */}
        <div className="mt-6 rounded-lg border border-white/10 bg-panel/60 p-4">
          <div className="mb-3 font-hud text-[10px] uppercase tracking-[0.3em] text-slate-500">
            {t('toScale', lang)}
          </div>
          <div className="flex items-end justify-center gap-8">
            {[
              { body: left, frac: scale.a, tint: '#66D9FF' },
              { body: right, frac: scale.b, tint: '#FFE81F' },
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
                  {body?.stats?.diameterKm
                    ? `${body.stats.diameterKm.toLocaleString(lang)} km`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <table className="mt-6 w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <th className="w-1/4 pb-2 font-normal" />
              <th className="pb-2 font-normal">{left ? L(left.names, lang) : ''}</th>
              <th className="pb-2 font-normal">{right ? L(right.names, lang) : ''}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-white/5 align-top">
                <td className="py-2 pr-3 text-slate-500">{row.label}</td>
                <td className="py-2 pr-3 text-slate-200">{row.a ?? '—'}</td>
                <td className="py-2 text-slate-200">{row.b ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

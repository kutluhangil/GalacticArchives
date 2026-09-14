// Full record for one world: everything the HUD panel trims for space —
// all fun facts, every point of interest, and the two-way character links.

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { CelestialBody, Character, TimelineEvent } from '../types/lore'
import {
  destroyedInEra,
  factionById,
  L,
  LL,
  loadAllPlanets,
  loadBody,
  loadCharacters,
  loadTimelineEvents,
  mediaById,
  regions,
  stations,
} from '../lib/lore'
import type { ArchiveGraph, ArchiveNode } from '../lib/archive-graph'
import { loadArchiveGraph } from '../lib/archive-graph-loader'
import { relationshipItemsFor } from '../lib/archive-relationships'
import { t } from '../lib/ui-strings'
import { articleUrl, sourceFor } from '../lib/sources'
import { useApp } from '../state/app'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import HoloPortrait from '../components/HoloPortrait'
import HolocronChrome from '../components/HolocronChrome'
import RelationshipExplorer from '../components/RelationshipExplorer'
import SourceLink from '../components/SourceLink'
import RelevantTours from '../components/RelevantTours'

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-6 border-b border-white/5 py-2 text-[13px]">
      <dt className="shrink-0 text-slate-400">{label}</dt>
      <dd className="text-right text-slate-200">{value}</dd>
    </div>
  )
}

export default function HolocronPlanet() {
  const { id = '' } = useParams()
  const { lang, era } = useApp()
  // one id-keyed result: a route change reads as "not loaded" on its own, with
  // no state reset inside the effect
  const [loaded, setLoaded] = useState<{
    id: string
    body: CelestialBody | null
    residents: Character[]
    characters: Character[]
    planets: CelestialBody[]
    events: TimelineEvent[]
    graph: ArchiveGraph | null
    graphError: string | null
  } | null>(null)
  const current = loaded?.id === id ? loaded : null
  const body = current?.body ?? null
  const residents = current?.residents ?? []
  const missing = current !== null && current.body === null
  useDocumentTitle(body ? L(body.names, lang) : null)

  useEffect(() => {
    let cancelled = false
    const graphPromise = loadArchiveGraph()
    Promise.all([loadBody(id), loadCharacters(), loadAllPlanets(), loadTimelineEvents()])
      .then(async ([b, all, planets, events]) => {
        let graph: ArchiveGraph | null = null
        let graphError: string | null = null
        try {
          graph = await graphPromise
        } catch (error) {
          graphError = error instanceof Error ? error.message : String(error)
        }
        if (cancelled) return
        setLoaded({
          id,
          body: b,
          residents: all.filter((c) => (b.characters ?? []).includes(c.id)),
          characters: all,
          planets,
          events,
          graph,
          graphError,
        })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ id, body: null, residents: [], characters: [], planets: [], events: [], graph: null, graphError: null })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (missing) {
    return (
      <HolocronChrome>
        <p className="py-16 text-center text-[13px] text-slate-400">{t('notFound', lang)}</p>
        <p className="text-center">
          <Link to="/holocron" className="text-[13px] text-holo-cyan hover:underline">
            ← {t('backToHolocron', lang)}
          </Link>
        </p>
      </HolocronChrome>
    )
  }

  if (!body) {
    return (
      <HolocronChrome>
        <p className="animate-pulse py-16 text-center text-[13px] tracking-[0.3em] text-holo-cyan">
          {t('loading', lang)}
        </p>
      </HolocronChrome>
    )
  }

  const faction = factionById(body.affiliationsByEra?.[era])
  const destroyed = destroyedInEra(body, era)
  const facts = LL(body.funFacts, lang)
  const relationshipLabels = new Map<ArchiveNode['id'], string>()
  for (const planet of current?.planets ?? []) {
    relationshipLabels.set(`body:${planet.id}`, L(planet.names, lang))
    for (const moon of planet.moonsDetail ?? []) relationshipLabels.set(`body:${moon.id}`, L(moon.names, lang))
  }
  for (const station of stations) relationshipLabels.set(`body:${station.id}`, L(station.names, lang))
  for (const character of current?.characters ?? []) relationshipLabels.set(`character:${character.id}`, L(character.names, lang))
  for (const event of current?.events ?? []) relationshipLabels.set(`event:${event.id}`, L(event.titles, lang))
  const relationshipItems = current?.graph
    ? relationshipItemsFor(current.graph, `body:${body.id}`, relationshipLabels)
    : []

  return (
    <HolocronChrome>
      <Link
        to="/holocron"
        className="mb-6 inline-block font-hud text-[12px] tracking-wide text-slate-400 transition-colors hover:text-holo-cyan"
      >
        ← {t('backToHolocron', lang)}
      </Link>

      <img
        src={`/cards/${body.id}.webp`}
        alt=""
        width={1200}
        height={600}
        decoding="async"
        className="mb-6 aspect-2/1 w-full rounded-lg border border-white/10 object-cover"
      />

      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl tracking-[0.2em] text-slate-100">
          {L(body.names, lang).toUpperCase()}
        </h1>
        {body.coordinates && (
          <span className="font-hud text-[13px] tracking-[0.3em] text-holo-cyan/80">
            {body.coordinates}
          </span>
        )}
      </div>
      <p className="mb-5 max-w-3xl text-[14px] leading-relaxed text-slate-400">
        {L(body.desc, lang)}
      </p>
      {sourceFor(body.id) && (
        <SourceLink source={sourceFor(body.id)!.source} className="mb-5" />
      )}

      <div className="mb-8 flex flex-wrap gap-2">
        {faction && (
          <span className="inline-flex items-center gap-2 rounded border border-white/10 bg-black/30 px-2.5 py-1 text-[12px] text-slate-300">
            <span className="h-2 w-2 rounded-full" style={{ background: faction.color }} />
            {t('affiliation', lang)}: {L(faction.names, lang)}
          </span>
        )}
        {destroyed && body.destruction && (
          <span className="rounded border border-sith-red/40 bg-sith-red/10 px-2.5 py-1 text-[12px] text-red-300">
            ⚠ {body.destruction.yearLabel} — {L(body.destruction.by, lang)}
          </span>
        )}
        <Link
          to={`/planet/${body.id}`}
          className="rounded border border-holo-cyan/40 bg-holo-cyan/5 px-2.5 py-1 text-[12px] text-holo-cyan transition-colors hover:bg-holo-cyan/15"
        >
          ◈ {t('viewIn3d', lang)}
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {facts.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-star-gold/80">
                {t('didYouKnow', lang)}
              </h2>
              <ul className="space-y-2">
                {facts.map((fact) => (
                  <li
                    key={fact}
                    className="rounded border border-star-gold/15 bg-star-gold/4 p-3 text-[13px] leading-relaxed text-slate-300"
                  >
                    {fact}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(body.poi ?? []).length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
                {t('pointsOfInterest', lang)}
              </h2>
              <ul className="space-y-2">
                {(body.poi ?? []).map((poi) => (
                  <li key={poi.id} className="rounded border border-white/8 bg-panel/60 p-3">
                    <div className="text-[13px] font-semibold tracking-wide text-holo-cyan">
                      {L(poi.names, lang)}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                      {L(poi.blurb, lang)}
                    </p>
                    {poi.source && (
                      <a
                        href={articleUrl(poi.source)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-block text-[10px] tracking-wide text-slate-600 transition-colors hover:text-holo-cyan"
                      >
                        {t('sourceLink', lang)}: {poi.source.replace('wookieepedia:', '')} ↗
                      </a>
                    )}
                    {!poi.source && (
                      <span title={t('unverifiedHint', lang)} className="mt-1.5 inline-block text-[10px] tracking-wide text-red-300/70">
                        {t('unverified', lang)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {residents.length > 0 && (
            <section>
              <h2 className="mb-3 font-hud text-[12px] uppercase tracking-[0.35em] text-slate-400">
                {t('notableResidents', lang)}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {residents.map((character) => (
                  <Link
                    key={character.id}
                    to={`/holocron/character/${character.id}`}
                    className="overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-holo-cyan/50"
                  >
                    <HoloPortrait id={character.id} name={L(character.names, lang)} size="sm" />
                    <div className="bg-panel/90 px-2 py-1.5 text-[12px] tracking-wide text-slate-200">
                      {L(character.names, lang)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <RelationshipExplorer
            lang={lang}
            focalLabel={L(body.names, lang)}
            items={relationshipItems}
          />
          {current?.graphError && (
            <p role="alert" className="mt-4 text-[11px] text-red-300/80">
              {t('relationshipUnavailable', lang)} {current.graphError}
            </p>
          )}
          <RelevantTours bodyId={body.id} lang={lang} />
        </div>

        <aside>
          <dl className="mb-6">
            <Row
              label={t('region', lang)}
              value={L(regions.find((r) => r.id === body.region)?.names, lang) || body.region}
            />
            <Row label={t('sector', lang)} value={body.sector} />
            <Row label={t('system', lang)} value={body.system} />
            <Row
              label={t('diameter', lang)}
              value={
                body.stats?.diameterKm
                  ? `${body.stats?.diameterKm.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${t('kmSuffix', lang)}`
                  : undefined
              }
            />
            <Row label={t('population', lang)} value={L(body.stats?.population, lang)} />
            <Row label={t('government', lang)} value={L(body.stats?.government, lang)} />
            <Row label={t('climate', lang)} value={LL(body.climate, lang).join(' · ')} />
            <Row label={t('terrain', lang)} value={LL(body.terrain, lang).join(' · ')} />
            <Row label={t('suns', lang)} value={body.suns?.map((s) => s.name).join(' · ')} />
            <Row
              label={t('moons', lang)}
              value={
                body.moons?.length
                  ? body.moons.join(' · ')
                  : body.stats?.moonCount
                    ? String(body.stats?.moonCount)
                    : undefined
              }
            />
          </dl>

          <h2 className="mb-2 font-hud text-[11px] uppercase tracking-[0.3em] text-slate-400">
            {t('appearances', lang)}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {body.appearances.map((mid) => {
              const entry = mediaById(mid)
              if (!entry) return null
              return (
                <span
                  key={mid}
                  className="rounded-sm border border-white/8 bg-black/40 px-2 py-0.5 text-[11px] text-slate-400"
                >
                  {L(entry.title, lang)} ({entry.year})
                </span>
              )
            })}
          </div>
        </aside>
      </div>
    </HolocronChrome>
  )
}

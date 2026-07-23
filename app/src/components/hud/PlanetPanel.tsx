import { useMemo, useState } from 'react'
import type { CelestialBody } from '../../types/lore'
import { useApp } from '../../state/app'
import { L, LL, factionById, mediaById, regions } from '../../lib/lore'
import { t } from '../../lib/ui-strings'

function Row({ label, value }: { label: string; value: string | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 py-1.5 text-[12px]">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{value}</span>
    </div>
  )
}

export default function PlanetPanel({ body }: { body: CelestialBody }) {
  const { lang, era } = useApp()
  const [factIdx, setFactIdx] = useState(0)
  const facts = LL(body.funFacts, lang)
  const faction = factionById(body.affiliationsByEra?.[era])
  const destroyed =
    body.destruction &&
    (era === body.destruction.destroyedFromEra || era === 'new-republic')

  const appearanceTitles = useMemo(
    () =>
      body.appearances
        .map((id) => mediaById(id))
        .filter(Boolean)
        .map((m) => `${L(m!.title, lang)} (${m!.year})`),
    [body, lang],
  )

  return (
    <aside className="pointer-events-auto absolute left-4 top-24 z-10 w-[340px] max-w-[calc(100vw-2rem)] rounded-lg border border-holo-cyan/15 bg-panel/80 p-4 backdrop-blur-md">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="font-display text-2xl tracking-[0.2em] text-slate-100">
          {L(body.names, lang).toUpperCase()}
        </h1>
        {body.coordinates && (
          <span className="text-[11px] tracking-widest text-holo-cyan/80">{body.coordinates}</span>
        )}
      </div>
      <p className="mb-3 text-[12.5px] leading-relaxed text-slate-400">{L(body.desc, lang)}</p>

      {faction && (
        <div className="mb-3 inline-flex items-center gap-2 rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px]">
          <span className="h-2 w-2 rounded-full" style={{ background: faction.color }} />
          <span className="text-slate-300">
            {t('affiliation', lang)}: {L(faction.names, lang)}
          </span>
        </div>
      )}
      {destroyed && body.destruction && (
        <div className="mb-3 rounded border border-sith-red/40 bg-sith-red/10 px-2 py-1.5 text-[11px] text-red-300">
          ⚠ {body.destruction.yearLabel} — {L(body.destruction.by, lang)}
        </div>
      )}

      <div className="mb-3">
        <Row
          label={t('region', lang)}
          value={L(regions.find((r) => r.id === body.region)?.names, lang) || body.region}
        />
        <Row label={t('sector', lang)} value={body.sector} />
        <Row label={t('system', lang)} value={body.system} />
        <Row
          label={t('diameter', lang)}
          value={body.stats.diameterKm ? `${body.stats.diameterKm.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} km` : undefined}
        />
        <Row label={t('population', lang)} value={L(body.stats.population, lang)} />
        <Row label={t('government', lang)} value={L(body.stats.government, lang)} />
        <Row label={t('climate', lang)} value={LL(body.climate, lang).join(' · ')} />
        <Row label={t('terrain', lang)} value={LL(body.terrain, lang).join(' · ')} />
        <Row
          label={t('suns', lang)}
          value={body.suns?.map((s) => s.name).join(' · ')}
        />
        <Row
          label={t('moons', lang)}
          value={
            body.moons?.length
              ? body.moons.join(' · ')
              : body.stats.moonCount
                ? String(body.stats.moonCount)
                : undefined
          }
        />
      </div>

      <div className="mb-3">
        <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
          {t('appearances', lang)}
        </div>
        <div className="flex flex-wrap gap-1">
          {appearanceTitles.map((title) => (
            <span
              key={title}
              className="rounded-sm border border-white/8 bg-black/40 px-1.5 py-0.5 text-[10px] text-slate-400"
            >
              {title}
            </span>
          ))}
        </div>
      </div>

      {facts.length > 0 && (
        <button
          onClick={() => setFactIdx((factIdx + 1) % facts.length)}
          className="w-full rounded border border-star-gold/20 bg-star-gold/5 p-2.5 text-left transition-colors hover:border-star-gold/40"
        >
          <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-star-gold/80">
            {t('didYouKnow', lang)} · {factIdx + 1}/{facts.length}
          </div>
          <p className="text-[12px] leading-relaxed text-slate-300">{facts[factIdx]}</p>
        </button>
      )}
    </aside>
  )
}

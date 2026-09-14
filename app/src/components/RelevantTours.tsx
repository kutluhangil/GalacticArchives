import type { Lang } from '../lib/lore'
import { L } from '../lib/lore'
import { toursForBody } from '../lib/tour-index'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'

/** Starts only an existing route that names this body as a stop. */
export default function RelevantTours({ bodyId, lang }: { bodyId: string; lang: Lang }) {
  const startTour = useApp((state) => state.startTour)
  const tours = toursForBody(bodyId)
  if (!tours.length) return null

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-hud text-[11px] uppercase tracking-[0.3em] text-slate-400">
        {t('guidedRoutes', lang)}
      </h2>
      <div className="flex flex-wrap gap-2">
        {tours.map((tour) => (
          <button
            key={tour.id}
            onClick={() => startTour({ kind: 'authored', id: tour.id })}
            className="rounded border border-star-gold/25 bg-star-gold/4 px-2.5 py-1.5 text-left transition-colors hover:border-star-gold/50 hover:bg-star-gold/8"
          >
            <span className="block text-[12px] text-star-gold/90">{L(tour.names, lang)}</span>
            <span className="mt-0.5 block max-w-xs text-[10px] leading-snug text-slate-500">{L(tour.blurb, lang)}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

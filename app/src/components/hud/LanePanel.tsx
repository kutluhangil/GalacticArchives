// One charted lane, read rather than drawn: what it is, where it calls, how
// much of it this archive actually holds — and the flight along it.

import { L } from '../../lib/lore'
import { laneArchiveStops, laneLengthParsecs, MIN_TOUR_STOPS } from '../../lib/lane-tour'
import { routes, stopLabel } from '../../lib/routes'
import { articleUrl } from '../../lib/sources'
import { t } from '../../lib/ui-strings'
import { useApp } from '../../state/app'
import { useFlyTo } from '../useFlyTo'

export interface LanePanelProps {
  routeId: string
  onClose: () => void
}

export default function LanePanel({ routeId, onClose }: LanePanelProps) {
  const lang = useApp((s) => s.lang)
  const startTour = useApp((s) => s.startTour)
  const flyTo = useFlyTo()

  // the id comes off the URL, where anyone can type anything; an unknown lane
  // is not an error, it is simply no selection
  const route = routes.find((r) => r.id === routeId)
  if (!route) return null

  const kept = laneArchiveStops(route)
  const flyable = kept.length >= MIN_TOUR_STOPS

  return (
    <section
      aria-label={t('laneSelected', lang)}
      className="pointer-events-auto absolute left-4 top-16 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-holo-cyan/20 bg-panel/95 p-3 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-hud text-[13px] uppercase tracking-[0.2em] text-holo-cyan">
          {L(route.names, lang)}
        </h2>
        <button
          onClick={onClose}
          aria-label={t('laneClose', lang)}
          className="rounded border border-white/10 px-1.5 text-[11px] text-slate-400 transition-colors hover:border-sith-red/50 hover:text-red-300"
        >
          ✕
        </button>
      </div>

      <p className="mt-1.5 text-[11.5px] leading-snug text-slate-300">{L(route.blurb, lang)}</p>

      <p className="mt-2 font-hud text-[10px] uppercase tracking-[0.2em] text-slate-500">
        {route.stops.length} {t('laneStops', lang)} · {kept.length} {t('laneInArchive', lang)} ·{' '}
        {Math.round(laneLengthParsecs(route))} {t('courseParsecs', lang)}
      </p>

      {flyable ? (
        <button
          onClick={() => startTour({ kind: 'lane', id: route.id })}
          className="mt-2 w-full rounded border border-star-gold/40 bg-star-gold/10 px-2 py-1 text-[11px] tracking-wide text-star-gold transition-colors hover:bg-star-gold/20"
        >
          ▶ {t('laneFly', lang)}
        </button>
      ) : (
        <p className="mt-2 text-[11px] leading-snug text-amber-300/80">{t('laneTooThin', lang)}</p>
      )}

      <ol className="mt-2.5 max-h-[40vh] space-y-1 overflow-y-auto border-t border-white/5 pt-2">
        {route.stops.map((stop, i) => (
          <li key={`${stop.article}-${i}`} className="text-[11px] leading-snug">
            <span className="text-slate-500">{i + 1}.</span>{' '}
            {stop.bodyId ? (
              <button
                onClick={() => flyTo(`/planet/${stop.bodyId}`)}
                className="text-holo-cyan underline-offset-2 hover:underline"
              >
                {stopLabel(stop)}
              </button>
            ) : (
              <span className="text-slate-400">{stopLabel(stop)}</span>
            )}
            <span className="pl-1.5 text-[10px] text-slate-600">{stop.coordinates}</span>
          </li>
        ))}
      </ol>

      <a
        href={articleUrl(route.source)}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block border-t border-white/5 pt-2 text-[10px] text-slate-500 transition-colors hover:text-holo-cyan"
      >
        {t('laneSource', lang)} ↗
      </a>
    </section>
  )
}

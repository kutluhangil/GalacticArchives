// Course plotter: pick two stops on the hyperlane network and get the shortest
// charted way between them, leg by leg. The map draws the same course.

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../state/app'
import { L } from '../../lib/lore'
import { gridToPos } from '../../lib/galaxy-grid'
import { laneNodes, planCourse, routes, type LaneNode } from '../../lib/routes'
import { t } from '../../lib/ui-strings'
import { useFlyTo } from '../useFlyTo'

export interface RoutePlannerProps {
  /** the plotted course, as disk positions; null clears it from the map */
  onCourse: (points: { x: number; z: number }[] | null) => void
}

/** worlds this archive holds first: they are the stops a visitor can open */
function groupStops(nodes: LaneNode[]): { archive: LaneNode[]; charted: LaneNode[] } {
  return {
    archive: nodes.filter((n) => n.bodyId),
    charted: nodes.filter((n) => !n.bodyId),
  }
}

export default function RoutePlanner({ onCourse }: RoutePlannerProps) {
  const lang = useApp((s) => s.lang)
  const flyTo = useFlyTo()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const nodes = useMemo(() => laneNodes(), [])
  const groups = useMemo(() => groupStops(nodes), [nodes])
  const course = useMemo(() => (from && to && from !== to ? planCourse(from, to) : null), [from, to])

  useEffect(() => {
    if (!course?.legs.length) {
      onCourse(null)
      return
    }
    const stops = [course.legs[0].from, ...course.legs.map((leg) => leg.to)]
    onCourse(stops.map((stop) => gridToPos(stop.coordinates)))
  }, [course, onCourse])

  // the course stays on the map when the panel is closed: the panel is the
  // control, the course is the answer, and folding the control away should not
  // throw the answer out. The Clear button is how it goes.

  const laneName = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    return route ? L(route.names, lang) : routeId
  }

  const picker = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    id: string,
  ) => (
    <label htmlFor={id} className="block">
      <span className="mb-0.5 block font-hud text-[9px] uppercase tracking-[0.25em] text-slate-500">
        {label}
      </span>
      <select
        id={id}
        // the wrapping label would otherwise name this control after every
        // option inside it, since the options are part of its text content
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/10 bg-black/50 px-1.5 py-1 text-[12px] text-slate-200 outline-none focus:border-holo-cyan/60"
      >
        <option value="">{t('coursePick', lang)}</option>
        <optgroup label={t('stopsInArchive', lang)}>
          {groups.archive.map((node) => (
            <option key={node.article} value={node.article}>
              {node.label}
            </option>
          ))}
        </optgroup>
        <optgroup label={t('stopsCharted', lang)}>
          {groups.charted.map((node) => (
            <option key={node.article} value={node.article}>
              {node.label}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  )

  return (
    // on a phone the panel spans the width, so it sits a row above the map
    // hint in the bottom-left rather than on top of it
    <div className="pointer-events-auto absolute bottom-10 right-4 z-20 w-[min(20rem,calc(100vw-2rem))] sm:bottom-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`w-full rounded border px-2 py-1 text-[11px] tracking-wide transition-colors ${
          open
            ? 'border-holo-cyan/70 bg-holo-cyan/15 text-holo-cyan'
            : 'border-white/10 bg-black/40 text-slate-300 hover:border-holo-cyan/40 hover:text-holo-cyan'
        }`}
      >
        ✦ {t('coursePlotter', lang)}
      </button>

      {open && (
        <div className="mt-1.5 max-h-[60vh] overflow-y-auto rounded-lg border border-holo-cyan/20 bg-panel/95 p-3 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-2">
            {picker(t('courseFrom', lang), from, setFrom, 'course-from')}
            {picker(t('courseTo', lang), to, setTo, 'course-to')}
          </div>

          {from && to && from === to && (
            <p className="mt-2 text-[11px] text-slate-400">{t('courseSame', lang)}</p>
          )}
          {from && to && from !== to && !course && (
            <p className="mt-2 text-[11px] text-amber-300/80">{t('courseNone', lang)}</p>
          )}

          {course && course.legs.length > 0 && (
            <>
              <p className="mt-2.5 font-hud text-[11px] tracking-wide text-holo-cyan">
                {course.jumps} {t('courseJumps', lang)} · {Math.round(course.parsecs)}{' '}
                {t('courseParsecs', lang)} · {course.laneChanges} {t('courseLaneChanges', lang)}
              </p>
              <ol
                aria-label={t('coursePlotter', lang)}
                className="mt-2 space-y-1 border-t border-white/5 pt-2"
              >
                <li className="text-[11px] leading-snug">
                  <span className="font-hud text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    {t('courseDeparture', lang)}
                  </span>{' '}
                  <span className="text-slate-300">{course.legs[0].from.label}</span>
                </li>
                {course.legs.map((leg, i) => (
                  <li key={`${leg.from.article}-${leg.to.article}`} className="text-[11px] leading-snug">
                    <span className="text-slate-500">{i + 1}.</span>{' '}
                    {leg.to.bodyId ? (
                      <button
                        onClick={() => flyTo(`/planet/${leg.to.bodyId}`)}
                        className="text-holo-cyan underline-offset-2 hover:underline"
                      >
                        {leg.to.label}
                      </button>
                    ) : (
                      <span className="text-slate-300">{leg.to.label}</span>
                    )}
                    <span className="block pl-4 text-[10px] text-slate-500">
                      {laneName(leg.routeId)} ·{' '}
                      {/* the navigator grid resolves to 15 parsecs, so two stops
                          in one square measure as zero rather than as nothing */}
                      {leg.parsecs > 0
                        ? `${Math.round(leg.parsecs)} ${t('courseParsecs', lang)}`
                        : t('courseSameCell', lang)}
                    </span>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
                className="mt-2 rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
              >
                {t('courseClear', lang)}
              </button>
            </>
          )}

          <p className="mt-2.5 border-t border-white/5 pt-2 text-[10px] leading-snug text-slate-600">
            {t('courseScale', lang)}
          </p>
        </div>
      )}
    </div>
  )
}

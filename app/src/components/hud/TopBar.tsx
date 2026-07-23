import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { CelestialBody } from '../../types/lore'
import { useApp } from '../../state/app'
import { eras, L, loadAllPlanets, regions } from '../../lib/lore'
import { ERA_SHORT, t } from '../../lib/ui-strings'
import { OPEN_PALETTE_EVENT } from '../CommandPaletteHost'
import SettingsMenu from '../SettingsMenu'
import { tours } from '../../lib/tours'
import { useFavorites, useRecents } from '../../hooks/useCollections'
import { useFlyTo } from '../useFlyTo'

/** shared popover shell for the top-bar menus */
function Menu({
  label,
  children,
}: {
  label: string
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`rounded border px-2 py-0.5 text-[11px] tracking-wide transition-colors ${
          open
            ? 'border-holo-cyan/70 bg-holo-cyan/15 text-holo-cyan'
            : 'border-white/10 bg-black/30 text-slate-300 hover:border-holo-cyan/40 hover:text-holo-cyan'
        }`}
      >
        {label} ▾
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-30 max-h-[62vh] w-60 overflow-y-auto rounded-lg border border-holo-cyan/20 bg-panel/95 p-2 backdrop-blur-md">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

/** worlds the visitor starred or has been to, empty sections omitted */
function CollectionsMenu() {
  const { lang } = useApp()
  const flyTo = useFlyTo()
  const favorites = useFavorites()
  const recents = useRecents()
  const [planets, setPlanets] = useState<CelestialBody[]>([])

  useEffect(() => {
    loadAllPlanets().then(setPlanets)
  }, [])

  if (!favorites.length && !recents.length) return null
  const nameOf = (id: string) => {
    const planet = planets.find((p) => p.id === id)
    return planet ? L(planet.names, lang) : id
  }

  return (
    <Menu label={t('favorites', lang)}>
      {(close) => (
        <>
          {[
            { key: 'favorites' as const, ids: favorites },
            { key: 'recents' as const, ids: recents },
          ].map(
            (group) =>
              group.ids.length > 0 && (
                <div key={group.key} className="mb-1.5">
                  <div className="px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-slate-500">
                    {t(group.key, lang)}
                  </div>
                  {group.ids.map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        close()
                        flyTo(`/planet/${id}`)
                      }}
                      className="block w-full rounded px-2 py-1 text-left text-[12px] text-slate-300 transition-colors hover:bg-white/5 hover:text-slate-100"
                    >
                      {nameOf(id)}
                    </button>
                  ))}
                </div>
              ),
          )}
        </>
      )}
    </Menu>
  )
}

/** narrated routes through the galaxy */
function ToursMenu() {
  const { lang } = useApp()
  const startTour = useApp((s) => s.startTour)
  return (
    <Menu label={t('tours', lang)}>
      {(close) => (
        <>
          {tours.map((tour) => (
            <button
              key={tour.id}
              onClick={() => {
                close()
                startTour(tour.id)
              }}
              className="block w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-white/5"
            >
              <span className="block text-[12px] text-slate-200">{L(tour.names, lang)}</span>
              <span className="block text-[10.5px] leading-snug text-slate-500">
                {L(tour.blurb, lang)}
              </span>
            </button>
          ))}
        </>
      )}
    </Menu>
  )
}

function PlanetsDropdown() {
  const { lang } = useApp()
  const { id } = useParams()
  const jump = useFlyTo()
  const [open, setOpen] = useState(false)
  const [planets, setPlanets] = useState<CelestialBody[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || planets.length) return
    loadAllPlanets().then(setPlanets)
  }, [open, planets.length])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`rounded border px-2 py-0.5 text-[11px] tracking-wide transition-colors ${
          open
            ? 'border-holo-cyan/70 bg-holo-cyan/15 text-holo-cyan'
            : 'border-white/10 bg-black/30 text-slate-300 hover:border-holo-cyan/40 hover:text-holo-cyan'
        }`}
      >
        {t('planets', lang)} ▾
      </button>
      {open && (
        <div className="absolute left-0 top-7 z-30 max-h-[62vh] w-60 overflow-y-auto rounded-lg border border-holo-cyan/20 bg-panel/95 p-2 backdrop-blur-md">
          {regions.map((region) => {
            const members = planets.filter((p) => p.region === region.id)
            if (!members.length) return null
            return (
              <div key={region.id} className="mb-1.5">
                <div className="px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-slate-500">
                  {L(region.names, lang)}
                </div>
                {members.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setOpen(false)
                      jump(`/planet/${p.id}`)
                    }}
                    className={`block w-full rounded px-2 py-1 text-left text-[12px] transition-colors ${
                      id === p.id
                        ? 'bg-holo-cyan/15 text-holo-cyan'
                        : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
                    }`}
                  >
                    {L(p.names, lang)}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TopBar() {
  const { lang, setLang, era, setEra } = useApp()
  const jump = useFlyTo()
  const navigate = useNavigate()

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-4">
      <div className="pointer-events-auto">
        <button
          onClick={() => navigate('/galaxy')}
          className="font-display text-lg font-bold tracking-[0.35em] text-star-gold drop-shadow-[0_0_12px_rgba(255,232,31,0.35)]"
        >
          {t('brand', lang)}
        </button>
        <nav className="mt-2 flex flex-wrap gap-1">
          <button
            onClick={() => jump('/galaxy')}
            className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] tracking-wide text-slate-300 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
          >
            ◉ {t('galaxy', lang)}
          </button>
          <PlanetsDropdown />
          <CollectionsMenu />
          <ToursMenu />
          <button
            onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
            className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] tracking-wide text-slate-400 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
          >
            {t('search', lang)} ⌘K
          </button>
        </nav>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <div className="flex rounded border border-white/10 bg-black/30 p-0.5">
          {eras.map((e) => (
            <button
              key={e.id}
              title={`${L(e.names, lang)} · ${e.range}`}
              onClick={() => setEra(e.id)}
              className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                era === e.id ? 'bg-star-gold/20 text-star-gold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ERA_SHORT[e.id][lang]}
            </button>
          ))}
        </div>
        <SettingsMenu />
        <button
          onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
          className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-slate-200 hover:text-holo-cyan"
        >
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>
    </header>
  )
}

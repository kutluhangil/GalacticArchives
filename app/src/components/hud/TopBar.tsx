import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { CelestialBody } from '../../types/lore'
import { useApp } from '../../state/app'
import { eras, L, loadAllPlanets, regions } from '../../lib/lore'
import { sectionName } from '../../lib/sections'
import { ERA_SHORT, t } from '../../lib/ui-strings'
import { OPEN_PALETTE_EVENT } from '../CommandPaletteHost'
import SettingsMenu from '../SettingsMenu'
import { tours } from '../../lib/tours'
import { useFavorites, useRecents, useSavedTours } from '../../hooks/useCollections'
import { toggleSavedTour } from '../../lib/collections'
import { useFlyTo } from '../useFlyTo'
import { sfx } from '../../lib/audio'

// The five tool panels are only ever reached from the menu below, and the top
// bar rides along on every route — importing them eagerly put roughly a
// thousand lines of modal into the first paint of the galaxy map.
const AurebeshTranslator = lazy(() => import('../AurebeshTranslator'))
const HyperspaceSimulator = lazy(() => import('../HyperspaceSimulator'))
const LightsaberChamber = lazy(() => import('../LightsaberChamber'))
const TransmissionPlayer = lazy(() => import('../TransmissionPlayer'))
const GalacticIdGenerator = lazy(() => import('../GalacticIdGenerator'))
/**
 * Routes that read as archive sections rather than map controls. They live in
 * one menu because thirteen flat chips wrapped the header onto a second row,
 * which then covered the planet panel's own controls.
 */
/** the names come from the shared section table, so the menu and the tab title
 *  cannot drift apart */
const ARCHIVE_ROUTES = [
  {
    path: '/timeline',
    icon: '📜',
    blurb: { tr: 'Kanon olayları sırasıyla', en: 'Canon events in order' },
  },
  {
    path: '/force',
    icon: '⚡',
    blurb: { tr: 'Güç yetenekleri ve yolları', en: 'Force powers and their paths' },
  },
  {
    path: '/watch-guide',
    icon: '🎬',
    blurb: { tr: 'Filmler ve diziler hangi sırayla', en: 'What to watch in which order' },
  },
  {
    path: '/hangar',
    icon: '🛸',
    blurb: { tr: 'Yıldız gemileri ve planları', en: 'Starships and their blueprints' },
  },
] as const

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
  const saved = useSavedTours()
  return (
    <Menu label={t('tours', lang)}>
      {(close) => (
        <>
          {tours.map((tour) => (
            <div key={tour.id} className="flex items-start gap-1 rounded transition-colors hover:bg-white/5">
              <button
                onClick={() => {
                  close()
                  startTour({ kind: 'authored', id: tour.id })
                }}
                className="min-w-0 flex-1 px-2 py-1.5 text-left"
              >
                <span className="block text-[12px] text-slate-200">{L(tour.names, lang)}</span>
                <span className="block text-[10.5px] leading-snug text-slate-500">
                  {L(tour.blurb, lang)}
                </span>
              </button>
              <button
                onClick={() => toggleSavedTour(tour.id)}
                aria-pressed={saved.includes(tour.id)}
                aria-label={t(saved.includes(tour.id) ? 'removeSavedTour' : 'saveTour', lang)}
                title={t(saved.includes(tour.id) ? 'removeSavedTour' : 'saveTour', lang)}
                className={`mt-1.5 px-2 text-[14px] leading-none transition-colors ${
                  saved.includes(tour.id) ? 'text-star-gold' : 'text-slate-600 hover:text-star-gold/70'
                }`}
              >
                {saved.includes(tour.id) ? '★' : '☆'}
              </button>
            </div>
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
  const { lang, setLang, era, setEra, legends, territory, setTerritory } = useApp()
  const jump = useFlyTo()
  const navigate = useNavigate()
  const [translatorOpen, setTranslatorOpen] = useState(false)
  const [hyperspaceOpen, setHyperspaceOpen] = useState(false)
  const [lightsabersOpen, setLightsabersOpen] = useState(false)
  const [transmissionsOpen, setTransmissionsOpen] = useState(false)
  const [idGenOpen, setIdGenOpen] = useState(false)

  // the Old Republic era belongs to the Legends layer; hide it otherwise
  const shownEras = eras.filter((e) => e.id !== 'old-republic' || legends)

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 p-4">
      <Suspense fallback={null}>
        {translatorOpen && <AurebeshTranslator onClose={() => setTranslatorOpen(false)} />}
        {hyperspaceOpen && <HyperspaceSimulator onClose={() => setHyperspaceOpen(false)} />}
        {lightsabersOpen && <LightsaberChamber onClose={() => setLightsabersOpen(false)} />}
        {transmissionsOpen && <TransmissionPlayer onClose={() => setTransmissionsOpen(false)} />}
        {idGenOpen && <GalacticIdGenerator onClose={() => setIdGenOpen(false)} />}
      </Suspense>

      <div className="pointer-events-auto">
        <button
          onClick={() => {
            sfx.playHover()
            navigate('/galaxy')
          }}
          className="font-display text-lg font-bold tracking-[0.35em] text-star-gold drop-shadow-[0_0_12px_rgba(255,232,31,0.35)]"
        >
          {t('brand', lang)}
        </button>
        <nav className="mt-2 flex flex-wrap gap-1">
          <button
            onClick={() => {
              sfx.playHover()
              jump('/galaxy')
            }}
            className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] tracking-wide text-slate-300 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
          >
            ◉ {t('galaxy', lang)}
          </button>
          <PlanetsDropdown />
          <CollectionsMenu />
          <ToursMenu />
          <Menu label={`📜 ${lang === 'tr' ? 'Arşiv' : 'Archive'}`}>
            {(close) =>
              ARCHIVE_ROUTES.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => {
                    close()
                    sfx.playHover()
                    navigate(entry.path)
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                >
                  <span className="block text-[12px] text-slate-200">
                    {entry.icon} {sectionName(entry.path, lang)}
                  </span>
                  <span className="block text-[10.5px] leading-snug text-slate-500">
                    {entry.blurb[lang]}
                  </span>
                </button>
              ))
            }
          </Menu>
          <Menu label={`🛠 ${lang === 'tr' ? 'Araçlar' : 'Tools'}`}>
            {(close) =>
              (
                [
                  {
                    icon: '🚀',
                    label: { tr: 'Hiperuzay', en: 'Hyperspace' },
                    blurb: { tr: 'Sıçrama süresi hesapla', en: 'Plot a jump and its duration' },
                    open: () => setHyperspaceOpen(true),
                    sound: () => sfx.playSelect(),
                  },
                  {
                    icon: '⚔️',
                    label: { tr: 'Işın Kılıçları', en: 'Lightsabers' },
                    blurb: { tr: 'Kristal ve kabza odası', en: 'The crystal and hilt chamber' },
                    open: () => setLightsabersOpen(true),
                    sound: () => sfx.playSelect(),
                  },
                  {
                    icon: '📻',
                    label: { tr: 'Telsizler', en: 'Transmissions' },
                    blurb: { tr: 'Kayıtlı galaktik yayınlar', en: 'Recorded galactic broadcasts' },
                    open: () => setTransmissionsOpen(true),
                    sound: () => sfx.playTransmission(),
                  },
                  {
                    icon: '🔤',
                    label: { tr: 'Aurebesh', en: 'Aurebesh' },
                    blurb: { tr: 'Yazıyı Aurebesh’e çevir', en: 'Transliterate into Aurebesh' },
                    open: () => setTranslatorOpen(true),
                    sound: () => sfx.playSelect(),
                  },
                  {
                    icon: '🪪',
                    label: { tr: 'Holo-Kimlik', en: 'Holo-ID' },
                    blurb: { tr: 'Kendine galaktik kimlik üret', en: 'Generate a galactic identity' },
                    open: () => setIdGenOpen(true),
                    sound: () => sfx.playSelect(),
                  },
                ] as const
              ).map((tool) => (
                <button
                  key={tool.icon}
                  onClick={() => {
                    close()
                    tool.sound()
                    tool.open()
                  }}
                  className="block w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                >
                  <span className="block text-[12px] text-slate-200">
                    {tool.icon} {tool.label[lang]}
                  </span>
                  <span className="block text-[10.5px] leading-snug text-slate-500">
                    {tool.blurb[lang]}
                  </span>
                </button>
              ))
            }
          </Menu>
          <button
            onClick={() => {
              sfx.playHover()
              setTerritory(!territory)
            }}
            className={`rounded border px-2 py-0.5 text-[11px] tracking-wide transition-colors ${
              territory
                ? 'border-holo-cyan/60 bg-holo-cyan/15 text-holo-cyan'
                : 'border-white/10 bg-black/30 text-slate-300 hover:border-holo-cyan/40 hover:text-holo-cyan'
            }`}
            title={lang === 'tr' ? 'Galaksi Nüfuz Haritası' : 'Territory Overlay'}
          >
            🗺️ {lang === 'tr' ? 'Nüfuz' : 'Territory'}
          </button>
          {/* Sci-Fi HUD Search Input Bar */}
          <div
            onClick={() => {
              sfx.playTransmission()
              window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))
            }}
            className="group flex cursor-pointer items-center gap-2 rounded border border-white/15 bg-black/50 px-3 py-1 text-[11px] tracking-wide text-slate-300 transition-all hover:border-holo-cyan/60 hover:bg-black/70 hover:shadow-[0_0_12px_rgba(102,217,255,0.2)]"
          >
            <span className="text-holo-cyan/80 group-hover:text-holo-cyan">🔍</span>
            <span className="w-32 truncate text-slate-400 group-hover:text-slate-200">
              {lang === 'tr' ? 'Arşivde Ara...' : 'Search Archives...'}
            </span>
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-hud text-[9px] uppercase tracking-wider text-slate-400 group-hover:text-holo-cyan">
              ⌘K
            </kbd>
          </div>
        </nav>
      </div>


      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <div className="flex max-w-full shrink overflow-x-auto rounded border border-white/10 bg-black/30 p-0.5">
          {shownEras.map((e) => (
            <button
              key={e.id}
              title={`${L(e.names, lang)} · ${e.range}`}
              onClick={() => {
                sfx.playHover()
                setEra(e.id)
              }}
              className={`shrink-0 whitespace-nowrap rounded px-2 py-0.5 text-[11px] transition-colors ${
                era === e.id ? 'bg-star-gold/20 text-star-gold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ERA_SHORT[e.id][lang]}
            </button>
          ))}
        </div>
        <SettingsMenu />
        <button
          onClick={() => {
            sfx.playHover()
            setLang(lang === 'tr' ? 'en' : 'tr')
          }}
          className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-slate-200 hover:text-holo-cyan"
        >
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>
      </div>
    </header>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { CelestialBody } from '../../types/lore'
import { useApp } from '../../state/app'
import { eras, L, loadAllPlanets, regions } from '../../lib/lore'
import { ERA_SHORT, t } from '../../lib/ui-strings'
import { OPEN_PALETTE_EVENT } from '../CommandPaletteHost'
import SettingsMenu from '../SettingsMenu'
import { useJump } from '../useJump'

function PlanetsDropdown() {
  const { lang } = useApp()
  const { id } = useParams()
  const jump = useJump()
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
  const jump = useJump()
  const navigate = useNavigate()

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
      <div className="pointer-events-auto">
        <button
          onClick={() => navigate('/galaxy')}
          className="font-display text-lg font-bold tracking-[0.35em] text-star-gold drop-shadow-[0_0_12px_rgba(255,232,31,0.35)]"
        >
          {t('brand', lang)}
        </button>
        <nav className="mt-2 flex gap-1">
          <button
            onClick={() => jump('/galaxy')}
            className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] tracking-wide text-slate-300 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
          >
            ◉ {t('galaxy', lang)}
          </button>
          <PlanetsDropdown />
          <button
            onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
            className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] tracking-wide text-slate-400 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
          >
            {t('search', lang)} ⌘K
          </button>
        </nav>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
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

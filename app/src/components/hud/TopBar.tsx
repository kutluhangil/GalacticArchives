import { useNavigate, useParams } from 'react-router'
import { useApp } from '../../state/app'
import { HERO_IDS, eras, L } from '../../lib/lore'
import { t } from '../../lib/ui-strings'
import { useJump } from '../useJump'

const HERO_LABELS: Record<string, string> = {
  tatooine: 'Tatooine',
  coruscant: 'Coruscant',
  mustafar: 'Mustafar',
  hoth: 'Hoth',
  bespin: 'Bespin',
}

export default function TopBar() {
  const { lang, setLang, era, setEra, muted, toggleMuted } = useApp()
  const { id } = useParams()
  const jump = useJump()
  const navigate = useNavigate()

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
      <div className="pointer-events-auto">
        <button
          onClick={() => navigate('/system/tatooine')}
          className="font-display text-lg font-bold tracking-[0.35em] text-star-gold drop-shadow-[0_0_12px_rgba(255,232,31,0.35)]"
        >
          {t('brand', lang)}
        </button>
        <nav className="mt-2 flex gap-1">
          {HERO_IDS.map((hero) => (
            <button
              key={hero}
              onClick={() => jump(`/planet/${hero}`)}
              className={`rounded border px-2 py-0.5 text-[11px] tracking-wide transition-colors ${
                id === hero
                  ? 'border-holo-cyan/70 bg-holo-cyan/15 text-holo-cyan'
                  : 'border-white/10 bg-black/30 text-slate-300 hover:border-holo-cyan/40 hover:text-holo-cyan'
              }`}
            >
              {HERO_LABELS[hero]}
            </button>
          ))}
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
              {e.range.split('–')[0]}
            </button>
          ))}
        </div>
        <button
          onClick={toggleMuted}
          title={muted ? 'Sound off' : 'Sound on'}
          className="rounded border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-slate-300 hover:text-holo-cyan"
        >
          {muted ? '🔇' : '🔊'}
        </button>
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

// Shared frame for the document side of the archive: scrollable page, brand
// bar, language toggle, source attribution. The 3D routes keep their own HUD.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'

export default function HolocronChrome({ children }: { children: ReactNode }) {
  const { lang, setLang } = useApp()
  return (
    <div className="h-full w-full overflow-y-auto bg-space">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-space/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            className="font-display text-[15px] font-bold tracking-[0.32em] text-star-gold"
          >
            {t('brand', lang)}
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/galaxy"
              className="rounded border border-white/10 bg-black/30 px-2 py-1 font-hud text-[12px] tracking-wide text-slate-300 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
            >
              ◉ {t('galaxy', lang)}
            </Link>
            <Link
              to="/holocron"
              className="rounded border border-white/10 bg-black/30 px-2 py-1 font-hud text-[12px] tracking-wide text-slate-300 transition-colors hover:border-holo-cyan/40 hover:text-holo-cyan"
            >
              ◈ {t('holocron', lang)}
            </Link>
            <button
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="rounded border border-white/10 bg-black/30 px-2 py-1 font-hud text-[12px] font-semibold tracking-wider text-slate-200 transition-colors hover:text-holo-cyan"
            >
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-12">
        <p className="border-t border-white/5 pt-5 font-hud text-[11px] leading-relaxed text-slate-600">
          {t('sources', lang)}
          <br />
          {t('disclaimer', lang)}
        </p>
      </footer>
    </div>
  )
}

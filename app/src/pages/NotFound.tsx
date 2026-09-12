// The catch-all route. It used to redirect to the landing page, which told a
// reader their address was fine and quietly lost what they asked for; a crawler
// read the same 200 on every mistyped URL. The route now says what happened,
// and `vercel.json` lets an unknown first-load fall through to dist/404.html so
// the status code says it too.

import { Link, useLocation } from 'react-router'
import TopBar from '../components/hud/TopBar'
import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'

export default function NotFound() {
  const lang = useApp((s) => s.lang)
  const { pathname } = useLocation()

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-space">
      <TopBar />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-40 text-center">
        <p className="font-hud text-[11px] tracking-[0.3em] text-holo-cyan/70">404</p>
        <h1 className="mt-3 font-display text-2xl tracking-[0.25em] text-slate-100">
          {t('notFoundTitle', lang).toLocaleUpperCase(lang)}
        </h1>
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed text-slate-400">
          {t('notFoundBody', lang)}
        </p>

        <p className="mt-6 font-hud text-[10px] uppercase tracking-[0.2em] text-slate-600">
          {t('notFoundPath', lang)}
        </p>
        <code className="mt-1 max-w-full truncate rounded border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[11px] text-slate-400">
          {pathname}
        </code>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            to="/galaxy"
            className="rounded border border-holo-cyan/30 bg-holo-cyan/10 px-4 py-2 text-[12px] text-holo-cyan transition-colors hover:bg-holo-cyan/20"
          >
            {t('errorHome', lang)}
          </Link>
          <Link
            to="/holocron"
            className="rounded border border-white/10 bg-black/30 px-4 py-2 text-[12px] text-slate-300 transition-colors hover:text-holo-cyan"
          >
            {t('notFoundHolocron', lang)}
          </Link>
        </div>
      </main>
    </div>
  )
}

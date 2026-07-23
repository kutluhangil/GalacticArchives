// Themed fallback rendered by ErrorBoundary. Kept in its own file so the
// boundary (a class) and this hook-using function component don't share a
// module — react-refresh needs component-only modules for fast refresh.

import { t } from '../lib/ui-strings'
import { useApp } from '../state/app'

export default function ErrorFallback({ error }: { error: Error | null }) {
  const lang = useApp((s) => s.lang)
  return (
    <div className="flex h-full w-full items-center justify-center bg-space p-6">
      <div className="w-[420px] max-w-full rounded-lg border border-holo-cyan/20 bg-panel/80 p-6 text-center backdrop-blur-md">
        <h1 className="font-display text-xl tracking-[0.25em] text-slate-100">
          {t('errorTitle', lang).toUpperCase()}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-400">{t('errorBody', lang)}</p>
        {error?.message && (
          <p className="mt-3 truncate font-mono text-[10px] text-slate-600" title={error.message}>
            {error.message}
          </p>
        )}
        <div className="mt-5 flex justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded border border-holo-cyan/30 bg-holo-cyan/10 px-3 py-1.5 text-[12px] text-holo-cyan transition-colors hover:bg-holo-cyan/20"
          >
            {t('errorReload', lang)}
          </button>
          <a
            href="/galaxy"
            className="rounded border border-white/10 bg-black/30 px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:text-holo-cyan"
          >
            {t('errorHome', lang)}
          </a>
        </div>
      </div>
    </div>
  )
}

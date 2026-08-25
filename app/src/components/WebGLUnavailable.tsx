import type { Lang } from '../lib/lore'
import { t } from '../lib/ui-strings'

export default function WebGLUnavailable({ lang, onRetry }: { lang: Lang; onRetry: () => void }) {
  return (
    <section
      role="alert"
      className="pointer-events-auto absolute inset-x-4 bottom-5 z-30 mx-auto max-w-xl rounded-lg border border-sith-red/35 bg-panel/95 p-4 backdrop-blur-md"
    >
      <h2 className="font-hud text-[12px] uppercase tracking-[0.3em] text-red-300">
        {t('webglUnavailableTitle', lang)}
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{t('webglUnavailableBody', lang)}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded border border-holo-cyan/40 bg-holo-cyan/5 px-2.5 py-1.5 text-[11px] text-holo-cyan transition-colors hover:bg-holo-cyan/15"
      >
        {t('webglRetry', lang)}
      </button>
    </section>
  )
}

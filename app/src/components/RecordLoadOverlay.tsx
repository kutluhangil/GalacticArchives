import { isUnknownBodyError, type Lang } from '../lib/lore'
import { t } from '../lib/ui-strings'

interface RecordLoadOverlayProps {
  error?: unknown
  lang: Lang
}

export default function RecordLoadOverlay({ error, lang }: RecordLoadOverlayProps) {
  if (!error) {
    return (
      <div className="animate-pulse text-[13px] tracking-[0.3em] text-holo-cyan">
        {t('loading', lang)}
      </div>
    )
  }

  const unknown = isUnknownBodyError(error)
  return (
    <div role="alert" className="max-w-md rounded border border-holo-red/40 bg-panel/95 p-6 text-center shadow-2xl">
      <div className="font-display text-xl tracking-[0.16em] text-slate-100">
        {unknown ? t('notFound', lang) : t('errorTitle', lang)}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        {unknown ? t('recordMissing', lang) : t('errorBody', lang)}
      </p>
      <a href="/galaxy" className="mt-5 inline-block text-xs tracking-[0.16em] text-holo-cyan hover:text-white">
        {t('errorHome', lang)}
      </a>
    </div>
  )
}

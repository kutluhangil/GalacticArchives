// The citation line under a codex record. Every starship, battle, Force power,
// timeline event, watch-guide entry and transmission points at the Wookieepedia
// article it was written from — the same rule the worlds and characters follow,
// and what the CC BY-SA attribution rests on.

import { useApp } from '../state/app'
import { articleUrl } from '../lib/sources'
import { t } from '../lib/ui-strings'

export default function SourceLink({ source, className = '' }: { source: string; className?: string }) {
  const lang = useApp((s) => s.lang)
  const article = source.replace(/^wookieepedia:/, '')

  return (
    <a
      href={articleUrl(source)}
      target="_blank"
      rel="noreferrer"
      className={`inline-block text-[10px] text-slate-500 transition-colors hover:text-holo-cyan ${className}`}
    >
      {t('sourceLink', lang)}: {article} ↗
    </a>
  )
}

// Shell for the top bar's tool panels. They shipped as bare overlay divs: no
// dialog role, no label, no Escape, and Tab walked straight out of the panel
// into the map behind it — a keyboard visitor could open one and never get out.
//
// One shell rather than five copies, so the behaviour is fixed in one place:
// the dialog is labelled by its own heading, Escape and a backdrop click close
// it, focus moves in on open and returns to whatever opened it on close, and
// Tab cycles inside.

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useApp } from '../state/app'
import { t } from '../lib/ui-strings'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function ModalShell({
  title,
  onClose,
  panelClassName = 'max-w-lg',
  accent = 'holo-cyan',
  backdrop = null,
  children,
}: {
  title: ReactNode
  onClose: () => void
  /** width and any panel-specific layout classes */
  panelClassName?: string
  /** heading colour, matching the panel it belongs to */
  accent?: 'holo-cyan' | 'star-gold'
  /** decoration painted behind the panel, e.g. the hyperspace starfield */
  backdrop?: ReactNode
  children: ReactNode
}) {
  const lang = useApp((s) => s.lang)
  const headingId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const stops = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      if (!stops.length) return
      const first = stops[0]
      const last = stops[stops.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {backdrop}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`relative z-20 max-h-[88vh] w-full overflow-y-auto rounded-xl border border-holo-cyan/40 bg-panel/95 p-6 shadow-[0_0_35px_rgba(102,217,255,0.2)] ${panelClassName}`}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2
            id={headingId}
            className={`font-display text-lg tracking-[0.2em] ${
              accent === 'star-gold' ? 'text-star-gold' : 'text-holo-cyan'
            }`}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('close', lang)}
            className="rounded px-1 text-slate-400 transition-colors hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

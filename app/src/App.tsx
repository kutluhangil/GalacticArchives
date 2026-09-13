import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router'
import ErrorBoundary from './components/ErrorBoundary'
import TransitionVeil from './components/TransitionVeil'
import TourPlayerHost from './components/TourPlayerHost'
import CommandPaletteHost from './components/CommandPaletteHost'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { setQuality } from './lib/quality'
import { t } from './lib/ui-strings'
import { useApp } from './state/app'

function RouteFallback() {
  const lang = useApp((s) => s.lang)
  return (
    <div className="flex h-full w-full items-center justify-center bg-space">
      <div className="animate-pulse text-[13px] tracking-[0.3em] text-holo-cyan">
        {t('loading', lang)}
      </div>
    </div>
  )
}

/** Root layout: the persistent chrome (tours, veil, ⌘K) plus the routed page.
 *  Rendered by every route through the data router (see router.tsx), which is
 *  what lets `<Link viewTransition>` drive real view transitions. */
export default function App() {
  const lang = useApp((s) => s.lang)
  const quality = useApp((s) => s.quality)

  // keep the document language in sync for screen readers and hyphenation
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // every route whose title is not a record name: sections, the front door and
  // the catch-all. Record pages pass their own name to the same hook.
  useDocumentTitle()

  // the engines read quality directly, so mirror the stored preference in
  useEffect(() => {
    setQuality(quality)
  }, [quality])

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
      <TourPlayerHost />
      <TransitionVeil />
      <CommandPaletteHost />
    </>
  )
}

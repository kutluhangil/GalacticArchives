// Owns the ⌘K shortcut so the palette's own bundle (cmdk + the full lore
// index) only loads the first time someone actually opens it.

import { lazy, Suspense, useEffect, useState } from 'react'

export const OPEN_PALETTE_EVENT = 'ga-open-palette'

const CommandPalette = lazy(() => import('./CommandPalette'))

export default function CommandPaletteHost() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen)
    }
  }, [])

  if (!open) return null
  return (
    <Suspense fallback={null}>
      <CommandPalette onClose={() => setOpen(false)} />
    </Suspense>
  )
}

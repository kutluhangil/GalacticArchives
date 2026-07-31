import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// The integrity suite runs in the node environment, where there is no DOM at
// all; everything below is jsdom-only housekeeping.
const hasDom = typeof document !== 'undefined'

// jsdom implements no FontFaceSet. Stubbing it as "font missing" matches the
// shipped default: no redistributable Aurebesh face is bundled, so <Aurebesh>
// renders nothing (see src/components/Aurebesh.tsx).
if (hasDom && !('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      load: () => Promise.resolve([]),
      check: () => false,
    },
  })
}

// jsdom keeps one window per file, so localStorage leaks between cases unless
// it is cleared explicitly (collections and the app store both persist there).
afterEach(() => {
  if (!hasDom) return
  cleanup()
  localStorage.clear()
})

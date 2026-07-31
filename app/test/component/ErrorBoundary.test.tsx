// The boundary is the only thing between a thrown engine/route error and a
// white screen, so it gets an explicit test rather than trust.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../src/components/ErrorBoundary'
import { useApp } from '../../src/state/app'
import { t } from '../../src/lib/ui-strings'

function Boom({ message }: { message: string }): never {
  throw new Error(message)
}

beforeEach(() => {
  useApp.setState({ lang: 'en' })
})

describe('ErrorBoundary', () => {
  it('renders its children while nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>galaxy map</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('galaxy map')).toBeInTheDocument()
  })

  it('shows the themed fallback and the real cause when a child throws', () => {
    // React logs the caught error itself; keep the test output readable
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom message="WebGL context lost" />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('heading', { name: t('errorTitle', 'en').toUpperCase() })).toBeInTheDocument()
    expect(screen.getByText('WebGL context lost')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: t('errorReload', 'en') })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('errorHome', 'en') })).toHaveAttribute('href', '/galaxy')

    // the boundary must not swallow the cause — it logs it for debugging
    expect(consoleError).toHaveBeenCalledWith('Uncaught render error:', expect.any(Error))
  })
})

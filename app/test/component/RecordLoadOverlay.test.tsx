import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import RecordLoadOverlay from '../../src/components/RecordLoadOverlay'
import { UnknownBodyError } from '../../src/lib/lore'

describe('RecordLoadOverlay', () => {
  it('turns an unknown deep-link into a usable archive return path', () => {
    render(
      <MemoryRouter>
        <RecordLoadOverlay error={new UnknownBodyError('not-a-world')} lang="en" />
      </MemoryRouter>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No such record in the archives.')
    expect(screen.getByRole('link', { name: 'Back to the galaxy' })).toHaveAttribute('href', '/galaxy')
  })
})

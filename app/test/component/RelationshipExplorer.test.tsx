import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import RelationshipExplorer from '../../src/components/RelationshipExplorer'

describe('RelationshipExplorer', () => {
  it('exposes sourced relationship targets as ordinary keyboard links', () => {
    render(
      <MemoryRouter>
        <RelationshipExplorer
          lang="en"
          focalLabel="Luke Skywalker"
          items={[
            {
              id: 'homeworld',
              label: 'Tatooine',
              relation: 'homeworld',
              to: '/holocron/planet/tatooine',
              evidence: 'character:luke-skywalker · homeworldId',
            },
            {
              id: 'yavin',
              label: 'Battle of Yavin',
              relation: 'participates-in',
              to: '/timeline#event-battle-of-yavin',
              evidence: 'event:battle-of-yavin · characterIds',
            },
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Archive connections' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tatooine.*Homeworld/i })).toHaveAttribute('href', '/holocron/planet/tatooine')
    expect(screen.getByText(/character:luke-skywalker · homeworldId/)).toBeInTheDocument()
    expect(screen.getByLabelText('Relationship map for Luke Skywalker')).toBeInTheDocument()
  })
})

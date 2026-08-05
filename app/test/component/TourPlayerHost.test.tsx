// The tour player rode on every first paint while having work to do on almost
// none of them: through lib/lore it carried the station, era, region, faction
// and production tables plus the authored itineraries. Its host is what keeps
// that behind the moment a tour actually starts, so the test that matters is
// that nothing loads until one does — and that one still plays when it does.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import TourPlayerHost from '../../src/components/TourPlayerHost'
import { useApp } from '../../src/state/app'

beforeEach(() => {
  useApp.setState({ lang: 'en', sfx: false, tour: null })
})

const show = () =>
  render(
    <MemoryRouter initialEntries={['/galaxy']}>
      <TourPlayerHost />
    </MemoryRouter>,
  )

describe('TourPlayerHost', () => {
  it('renders nothing while no tour is running', () => {
    const { container } = show()
    expect(container).toBeEmptyDOMElement()
  })

  it('loads the player once a tour starts', async () => {
    show()
    useApp.getState().startTour({ kind: 'authored', id: 'rogue-one' })

    await waitFor(() => expect(screen.getByRole('region')).toBeInTheDocument())
  })
})

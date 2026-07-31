// The lane panel is the only place a lane is read rather than drawn, so what
// is guarded here is that it tells the truth about the lane: its stops, how
// many the archive holds, and whether it can be flown at all.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import LanePanel from '../../src/components/hud/LanePanel'
import { laneArchiveStops, MIN_TOUR_STOPS } from '../../src/lib/lane-tour'
import { routes } from '../../src/lib/routes'
import { t } from '../../src/lib/ui-strings'
import { useApp } from '../../src/state/app'

const flyable = routes.find((r) => laneArchiveStops(r).length >= MIN_TOUR_STOPS)!
const tooThin = routes.find((r) => laneArchiveStops(r).length < MIN_TOUR_STOPS)!

const show = (routeId: string) =>
  render(
    <MemoryRouter>
      <LanePanel routeId={routeId} onClose={() => {}} />
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  useApp.setState({ lang: 'en' })
})

describe('LanePanel', () => {
  it('names the lane and cites the article it came from', () => {
    show(flyable.id)
    expect(screen.getByRole('heading', { name: flyable.names.en })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: new RegExp(t('laneSource', 'en')) })).toHaveAttribute(
      'href',
      expect.stringContaining('starwars.fandom.com/wiki/'),
    )
  })

  it('counts the stops it holds against the stops the lane has', () => {
    show(flyable.id)
    const kept = laneArchiveStops(flyable).length
    expect(
      screen.getByText(
        new RegExp(`${flyable.stops.length} ${t('laneStops', 'en')}.*${kept} ${t('laneInArchive', 'en')}`),
      ),
    ).toBeInTheDocument()
  })

  it('lists every stop, and only the ones with a record are reachable', () => {
    show(flyable.id)
    const list = screen.getByRole('list')
    expect(list.querySelectorAll('li')).toHaveLength(flyable.stops.length)
    // a stop with a record is a button into its world; the rest are plain text
    expect(within(list).getAllByRole('button')).toHaveLength(laneArchiveStops(flyable).length)
  })

  it('offers the flight when the lane can carry one', () => {
    show(flyable.id)
    // the label carries a play glyph, so match the copy rather than the whole name
    expect(screen.getByRole('button', { name: new RegExp(t('laneFly', 'en')) })).toBeInTheDocument()
  })

  it('says why a lane with too few records cannot be flown, instead of offering it', () => {
    show(tooThin.id)
    expect(screen.queryByRole('button', { name: t('laneFly', 'en') })).not.toBeInTheDocument()
    expect(screen.getByText(t('laneTooThin', 'en'))).toBeInTheDocument()
  })

  it('renders nothing for a lane id that is not charted', () => {
    const { container } = render(
      <MemoryRouter>
        <LanePanel routeId="the-kessel-shortcut" onClose={() => {}} />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

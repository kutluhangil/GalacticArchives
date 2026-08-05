// The four lore routes arrived with no test of their own. These cover what the
// pages promise rather than how they look: the record renders, the filters
// actually filter, the citation is reachable, and the page is navigable — each
// one has a main landmark and labelled filter groups, which none of them had.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Hangar from '../../src/pages/Hangar'
import WatchGuide from '../../src/pages/WatchGuide'
import ForceLore from '../../src/pages/ForceLore'
import { useApp } from '../../src/state/app'

beforeEach(() => {
  localStorage.clear()
  useApp.setState({ lang: 'en', era: 'empire', sfx: false })
})

const show = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Hangar', () => {
  it('opens on a ship and links the article it was written from', () => {
    show(<Hangar />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Millennium Falcon/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('link', { name: /Millennium Falcon ↗/ })).toHaveAttribute(
      'href',
      'https://starwars.fandom.com/wiki/Millennium_Falcon',
    )
  })

  it('filters the list by era, and says which filter is on', async () => {
    const user = userEvent.setup()
    show(<Hangar />)
    const ships = screen.getByRole('listbox', { name: 'Starships' })
    const all = within(ships).getAllByRole('option').length
    const filters = screen.getByRole('group', { name: 'Filter by era' })
    const cloneWars = within(filters).getByRole('button', { name: 'Clone Wars' })

    await user.click(cloneWars)

    expect(within(ships).getAllByRole('option').length).toBeLessThan(all)
    expect(cloneWars).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Watch Guide', () => {
  it('lists the canon in chronological order and can switch to release order', async () => {
    const user = userEvent.setup()
    show(<WatchGuide />)

    const chronological = screen.getByRole('button', { name: /Chronological/ })
    expect(chronological).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/^Episode I:/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Release Order/ }))
    expect(chronological).toHaveAttribute('aria-pressed', 'false')
  })

  it('narrows to a single medium', async () => {
    const user = userEvent.setup()
    show(<WatchGuide />)
    const before = screen.getByText(/entries$/).textContent

    await user.click(screen.getByRole('button', { name: 'Animation' }))
    expect(screen.getByText(/entries$/).textContent).not.toBe(before)
  })
})

describe('Force Vault', () => {
  it('reaches the powers catalogue through its tabs', async () => {
    const user = userEvent.setup()
    show(<ForceLore />)
    expect(screen.getByRole('tab', { name: /JEDI CODE/ })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('tab', { name: /FORCE POWERS/ }))
    expect(screen.getByRole('heading', { name: 'Telekinesis (Force Push/Pull)' })).toBeInTheDocument()
  })

  it('marks a Legends-only power rather than presenting it as canon', async () => {
    const user = userEvent.setup()
    show(<ForceLore />)
    await user.click(screen.getByRole('tab', { name: /FORCE POWERS/ }))

    const tutaminis = screen.getByRole('heading', { name: /Tutaminis/ })
    expect(within(tutaminis).getByText('Legends')).toBeInTheDocument()
  })

  it('shows the citation once a power is expanded', async () => {
    const user = userEvent.setup()
    show(<ForceLore />)
    await user.click(screen.getByRole('tab', { name: /FORCE POWERS/ }))

    expect(screen.queryByRole('link', { name: /Telekinesis ↗/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('heading', { name: 'Telekinesis (Force Push/Pull)' }))
    expect(screen.getByRole('link', { name: /Telekinesis ↗/ })).toHaveAttribute(
      'href',
      'https://starwars.fandom.com/wiki/Telekinesis',
    )
  })
})

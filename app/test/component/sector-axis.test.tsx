// Canon draws no sector borders — 60 sectors across the 74 worlds that state
// one, most of them holding a single world — so the archive carries the sector
// as an axis to filter and search along rather than a polygon on the map.
// These tests hold that axis to the data: the list is derived, "None" and "N/A"
// never become sector names, and the worlds canon leaves unplaced stay findable.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Holocron from '../../src/pages/Holocron'
import { loadAllPlanets, sectorShort, sectorsIn } from '../../src/lib/lore'
import { useApp } from '../../src/state/app'
import { t } from '../../src/lib/ui-strings'

beforeEach(() => {
  useApp.setState({ lang: 'en', sfx: false })
})

describe('sector index', () => {
  it('counts only sectors a world actually names, alphabetically', async () => {
    const planets = await loadAllPlanets()
    const sectors = sectorsIn(planets)

    expect(sectors.length).toBeGreaterThan(0)
    expect([...sectors].sort((a, b) => a.name.localeCompare(b.name))).toEqual(sectors)
    expect(sectors.reduce((sum, s) => sum + s.count, 0)).toBe(
      planets.filter((p) => p.sector).length,
    )
    // Arkanis holds Tatooine and its neighbours: the grouping the map cannot draw
    expect(sectors.find((s) => s.name === 'Arkanis sector')?.count).toBeGreaterThan(1)
  })

  it('never carries a placeholder as a sector name', async () => {
    for (const planet of await loadAllPlanets()) {
      if (planet.sector === undefined) continue
      expect(planet.sector, planet.id).not.toMatch(/^(none|n\/a|unknown)$/i)
      expect(planet.sector.trim(), planet.id).not.toBe('')
    }
  })

  it('drops the redundant word where a column already says sector', () => {
    expect(sectorShort('Arkanis sector')).toBe('Arkanis')
    expect(sectorShort('Bright Jewel')).toBe('Bright Jewel')
  })
})

describe('Holocron sector filter', () => {
  const open = () =>
    render(
      <MemoryRouter>
        <Holocron />
      </MemoryRouter>,
    )

  it('narrows the archive to one sector, figures included', async () => {
    const user = userEvent.setup()
    open()
    await waitFor(() => expect(screen.getByText(/TATOOINE/)).toBeInTheDocument())

    const select = screen.getByLabelText(t('sector', 'en'))
    await user.selectOptions(select, 'Arkanis sector')

    expect(screen.getByText(/TATOOINE/)).toBeInTheDocument()
    // a sector is a property of a world, so characters step aside like they do
    // under the region filter
    expect(screen.queryByText('Luke Skywalker')).not.toBeInTheDocument()
  })

  it('gathers the worlds canon places in no sector at all', async () => {
    const user = userEvent.setup()
    const planets = await loadAllPlanets()
    const unplaced = planets.filter((p) => !p.sector)
    expect(unplaced.length).toBeGreaterThan(0)

    open()
    await waitFor(() => expect(screen.getByText(/TATOOINE/)).toBeInTheDocument())

    const select = screen.getByLabelText(t('sector', 'en'))
    await user.selectOptions(select, screen.getByRole('option', { name: /Sector unstated/ }))

    expect(screen.queryByText(/TATOOINE/)).not.toBeInTheDocument()
    expect(screen.getByText(/EXEGOL/)).toBeInTheDocument()
  })
})

// Compare grew past a fixed pair. What matters is that the set lives in the
// URL (a comparison stays shareable), that old two-column links still resolve,
// and that the column controls respect the floor of two and the ceiling of four.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import Compare from '../../src/pages/Compare'
import { useApp } from '../../src/state/app'
import { t } from '../../src/lib/ui-strings'

// the planet columns build WebGL scenes, which jsdom has no canvas for
vi.mock('../../src/lib/engine/planet-engine', () => ({
  PlanetEngine: class {
    init() {}
    dispose() {}
    snapshot() {
      return null
    }
  },
}))

beforeEach(() => {
  localStorage.clear()
  useApp.setState({ lang: 'en', era: 'empire', legends: false, sfx: false })
})

function ShowLocation() {
  const location = useLocation()
  return <output data-testid="url">{location.search}</output>
}

const show = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/compare"
          element={
            <>
              <Compare />
              <ShowLocation />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )

const pickers = () => screen.getAllByRole('combobox')

describe('Compare columns', () => {
  it('starts as a pair when the URL says nothing', async () => {
    show('/compare')
    await waitFor(() => expect(pickers()).toHaveLength(2))
  })

  it('still reads a link written before the page grew past two columns', async () => {
    show('/compare?a=hoth&b=mustafar')
    // the options arrive with the planet index, so the value lands a tick later
    await waitFor(() => expect(pickers()[0]).toHaveValue('hoth'))
    expect(pickers()).toHaveLength(2)
    expect(pickers()[1]).toHaveValue('mustafar')
  })

  it('reads a set of four from the URL', async () => {
    show('/compare?ids=hoth,mustafar,naboo,endor')
    await waitFor(() => expect(pickers()).toHaveLength(4))
  })

  it('writes the set back to the URL, so the comparison is shareable', async () => {
    const user = userEvent.setup()
    show('/compare?ids=hoth,mustafar')
    const add = await screen.findByRole('button', { name: new RegExp(t('compareAdd', 'en')) })

    await user.click(add)
    await waitFor(() => expect(screen.getByTestId('url').textContent).toMatch(/ids=hoth%2Cmustafar/))
    expect(pickers()).toHaveLength(3)
  })

  it('offers no way past four columns', async () => {
    show('/compare?ids=hoth,mustafar,naboo,endor')
    await waitFor(() => expect(pickers()).toHaveLength(4))
    expect(
      screen.queryByRole('button', { name: new RegExp(t('compareAdd', 'en')) }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(t('compareFull', 'en'))).toBeInTheDocument()
  })

  it('keeps the mode in the URL, so a system comparison is as shareable as a planet one', async () => {
    const user = userEvent.setup()
    show('/compare')
    await waitFor(() => expect(pickers()).toHaveLength(2))

    await user.click(screen.getByRole('button', { name: t('systems', 'en') }))
    await waitFor(() =>
      expect(screen.getByTestId('url').textContent).toMatch(/mode=systems/),
    )
    // the mode change starts that mode's own set rather than carrying ids over
    expect(screen.getByTestId('url').textContent).toMatch(/ids=tatooine%2Cyavin/)
  })

  it('drops a column but never below a pair', async () => {
    const user = userEvent.setup()
    show('/compare?ids=hoth,mustafar,naboo')
    await waitFor(() => expect(pickers()).toHaveLength(3))

    await user.click(screen.getAllByRole('button', { name: t('compareRemove', 'en') })[0])
    await waitFor(() => expect(pickers()).toHaveLength(2))
    expect(screen.queryByRole('button', { name: t('compareRemove', 'en') })).not.toBeInTheDocument()
  })
})

// The system columns compare what surrounds a world rather than the world:
// its suns, its moons, and whatever the Empire parked in orbit that era. The
// schematic above the table is decorative, so every figure it draws has to be
// readable as text underneath it.
describe('Compare systems', () => {
  it('reads a system set from the URL and names the systems, not the worlds', async () => {
    show('/compare?mode=systems&ids=tatooine,yavin')

    await waitFor(() => expect(screen.getByText('TATOO SYSTEM')).toBeInTheDocument())
    expect(screen.getByText('YAVIN SYSTEM')).toBeInTheDocument()
    // no WebGL here: the schematic is SVG, so four systems cost no contexts
    expect(document.querySelectorAll('canvas')).toHaveLength(0)
  })

  it('writes out the suns, the moon figure and the named moons', async () => {
    show('/compare?mode=systems&ids=tatooine,yavin')

    await waitFor(() => expect(screen.getByText('2 · Tatoo I · Tatoo II')).toBeInTheDocument())
    expect(screen.getByText('Ghomrassen · Guermessa · Chenini')).toBeInTheDocument()
    expect(screen.getByText('Yavin 4')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: new RegExp(`^${t('moons', 'en')} 3 26$`) }))
      .toBeInTheDocument()
  })

  it('stands the Death Star up over Yavin only in the era it exists in', async () => {
    show('/compare?mode=systems&ids=tatooine,yavin')
    await waitFor(() => expect(screen.getByText(/Death Star/)).toBeInTheDocument())

    useApp.setState({ era: 'new-republic' })
    await waitFor(() => expect(screen.queryByText(/Death Star/)).not.toBeInTheDocument())
  })
})

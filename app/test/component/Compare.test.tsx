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

  it('drops a column but never below a pair', async () => {
    const user = userEvent.setup()
    show('/compare?ids=hoth,mustafar,naboo')
    await waitFor(() => expect(pickers()).toHaveLength(3))

    await user.click(screen.getAllByRole('button', { name: t('compareRemove', 'en') })[0])
    await waitFor(() => expect(pickers()).toHaveLength(2))
    expect(screen.queryByRole('button', { name: t('compareRemove', 'en') })).not.toBeInTheDocument()
  })
})

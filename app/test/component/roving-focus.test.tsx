// A card grid or mirror list that leaves every entry tabbable charges one Tab
// stop per record — the Holocron holds over a hundred — so the archive's long
// runs keep a single tabbable spot and hand the arrows the job of moving it.
// jsdom has no layout, so the row geometry is stubbed here and the real grid is
// walked in e2e/atlas.spec.ts.

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Holocron from '../../src/pages/Holocron'
import { rowRanges } from '../../src/hooks/useRovingFocus'
import { useApp } from '../../src/state/app'
import { t } from '../../src/lib/ui-strings'

beforeEach(() => {
  useApp.setState({ lang: 'en', sfx: false })
})

/** stand in for the layout jsdom never performs: `columns` cards per row */
function stubRows(items: HTMLElement[], columns: number) {
  items.forEach((el, i) => {
    Object.defineProperty(el, 'offsetTop', {
      value: Math.floor(i / columns) * 100,
      configurable: true,
    })
  })
}

describe('rowRanges', () => {
  it('starts a row wherever the vertical offset changes', () => {
    expect(rowRanges([0, 0, 0, 90, 90, 180])).toEqual([[0, 1, 2], [3, 4], [5]])
  })

  it('reads a single row and an empty list without inventing one', () => {
    expect(rowRanges([12, 12])).toEqual([[0, 1]])
    expect(rowRanges([])).toEqual([])
  })
})

describe('Holocron world grid', () => {
  const open = async () => {
    render(
      <MemoryRouter>
        <Holocron />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText(/TATOOINE/)).toBeInTheDocument())
    const cards = screen
      .getByText(/TATOOINE/)
      .closest('[data-roving-item]')!
      .parentElement!.querySelectorAll<HTMLElement>('[data-roving-item]')
    // the cards commit a beat before the effect that thins them down to one tab
    // stop, so wait for the effect rather than for the markup
    await waitFor(() => expect(cards[cards.length - 1].tabIndex).toBe(-1))
    return cards
  }

  it('spends one Tab stop on the whole grid', async () => {
    const cards = await open()
    expect(cards.length).toBeGreaterThan(20)

    const tabbable = [...cards].filter((el) => el.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toBe(cards[0])
  })

  it('walks the row with left and right, and carries the tab stop along', async () => {
    const user = userEvent.setup()
    const cards = await open()
    cards[0].focus()

    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(cards[1])
    expect(cards[1].tabIndex).toBe(0)
    expect(cards[0].tabIndex).toBe(-1)

    await user.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(cards[0])
  })

  it('holds the column when moving down a row and stops at the top edge', async () => {
    const user = userEvent.setup()
    const cards = await open()
    stubRows([...cards], 4)
    cards[1].focus()

    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(cards[5])

    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(cards[1])

    // no row above the first: the focus stays rather than leaking to the page
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(cards[1])
  })

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup()
    const cards = await open()
    cards[3].focus()

    await user.keyboard('{End}')
    expect(document.activeElement).toBe(cards[cards.length - 1])

    await user.keyboard('{Home}')
    expect(document.activeElement).toBe(cards[0])
  })

  it('hands the tab stop back to the first card when the filter swaps the grid', async () => {
    const user = userEvent.setup()
    const cards = await open()
    cards[2].focus()
    await user.keyboard('{ArrowRight}')
    expect(cards[3].tabIndex).toBe(0)

    await user.selectOptions(screen.getByLabelText(t('sector', 'en')), 'Arkanis sector')

    const filtered = screen
      .getByText(/TATOOINE/)
      .closest('[data-roving-item]')!
      .parentElement!.querySelectorAll<HTMLElement>('[data-roving-item]')
    const tabbable = [...filtered].filter((el) => el.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toBe(filtered[0])
  })
})

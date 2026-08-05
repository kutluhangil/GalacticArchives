// The chronology is scroll-driven now: events sit in era sections and a rail
// tracks where the reader is. jsdom neither scrolls nor measures, which is the
// point of these tests — the page has to read top to bottom without either, or
// the marking would be hiding the archive rather than pacing it.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import Timeline from '../../src/pages/Timeline'
import { useApp } from '../../src/state/app'

beforeEach(() => {
  localStorage.clear()
  useApp.setState({ lang: 'en', sfx: false })
})

const show = () =>
  render(
    <MemoryRouter>
      <Timeline />
    </MemoryRouter>,
  )

describe('Timeline', () => {
  it('reads every event where nothing scrolls and no rect has a size', async () => {
    show()
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /Battle of Yavin/ })).toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { name: /Battle of Exegol/ })).toBeInTheDocument()
  })

  it('groups the events under the era they belong to', async () => {
    show()
    const rail = await screen.findByRole('navigation', { name: 'Eras' })
    expect(within(rail).getAllByRole('button').length).toBeGreaterThan(1)
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(1)
  })

  it('drops an era from the rail when the filter empties it', async () => {
    const user = userEvent.setup()
    show()
    const rail = await screen.findByRole('navigation', { name: 'Eras' })
    const all = within(rail).getAllByRole('button').length

    await user.click(screen.getByRole('button', { name: 'BATTLES' }))

    await waitFor(() => expect(within(rail).getAllByRole('button').length).toBeLessThan(all))
  })

  it('narrows to one era when only that era has a matching event', async () => {
    const user = userEvent.setup()
    show()
    const rail = await screen.findByRole('navigation', { name: 'Eras' })

    // the Death Star's keel is the only construction event in the archive
    await user.click(screen.getByRole('button', { name: 'CONSTRUCTION' }))

    await waitFor(() => expect(within(rail).getAllByRole('button')).toHaveLength(1))
    expect(screen.queryByRole('heading', { name: /Battle of Yavin/ })).not.toBeInTheDocument()
    expect(screen.getByText('Construction')).toBeInTheDocument()
  })

  it('the rail moves the reader to an era section', async () => {
    const user = userEvent.setup()
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView

    show()
    const rail = await screen.findByRole('navigation', { name: 'Eras' })
    await user.click(within(rail).getAllByRole('button')[1])

    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('localises the category badge instead of printing the raw id', async () => {
    show()
    await waitFor(() => expect(screen.getAllByText('Battle').length).toBeGreaterThan(0))
    expect(screen.queryByText('jedi-sith')).not.toBeInTheDocument()
  })
})
